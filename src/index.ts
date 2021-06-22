import { AxiosResponse } from 'axios';
import WebSocket from 'ws';
import config from 'src/config';
import instance from 'src/instance';
import qna_update from 'src/qna_update';
import { solvedac_level_init, emoji_id } from 'src/solvedac_api';
import { TYPE_GUILD_CREATE } from 'src/discord_api';

let discord: WebSocket;

const send = (channelId: string, content: unknown): Promise<AxiosResponse<unknown>> =>
  instance.post(`https://discord.com/api/v8/channels/${channelId}/messages`, content);

const start = () => {
  let alive = true;
  let last_s: number | null = null;
  let ping: NodeJS.Timeout;
  let qna_update_timer: NodeJS.Timeout;
  discord = new WebSocket('wss://gateway.discord.gg/?v=8&encoding=json');
  discord.on('message', (data) => {
    try {
      const { op, d, s, t } = JSON.parse(data.toString()) as {
        op: number;
        d: unknown;
        s: number | null;
        t: string | null;
      };
//      console.log(`op ${op}, d ${JSON.stringify(d, null, 2)}, s ${s}, t ${t}`);
      last_s = s;
      if (op === 0) {
        if(t === "GUILD_CREATE"){
          let emojis = (d as TYPE_GUILD_CREATE).emojis;
          emojis.forEach(emoji => emoji_id[emoji.name] = emoji.id);
        }
      }
      else if (op === 10) {
        ping = setInterval(() => {
          if (!alive) {
            discord.terminate();
            return;
          }
          alive = false;
          discord.send(JSON.stringify({ op: 1, d: last_s }));
        }, (d as { heartbeat_interval: number }).heartbeat_interval);
        discord.send(
          JSON.stringify({
            op: 2,
            d: {
              token: config.token,
              intents: 513,
              properties: {
                $os: 'linux',
                $browser: 'my_library',
                $device: 'my_library',
              },
            },
          }),
        );
        qna_update_timer = setInterval(async () => 
          await qna_update(async (content: unknown) => void(await send(config.boj_qna_channel, content))), 60000);
//        send(config.bot_test_channel, "네이버");
      }
      else if (op === 11) alive = true;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err, data);
    }
  });
  discord.on('close', () => {
    clearInterval(ping);
    clearInterval(qna_update_timer);
    setTimeout(start, 5000);
  });
};

console.log('Hello world!');
solvedac_level_init();
start();

//qna_update(async (content: unknown) => void(await send(config.bot_test_channel, content)));

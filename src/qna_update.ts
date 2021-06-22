/* eslint-disable no-await-in-loop, no-console */

import { load, Element } from 'cheerio';
import axios from 'axios';
import config from 'src/config';
import { level_to_emoji, solvedac_level } from 'src/solvedac_api';
type TypePost = [string, string, number];
type TypeSend = (arg0: unknown) => Promise<void>;

const get_qna_posts = async () => {
  let response: { data: string } = await axios.get('https://www.acmicpc.net/board/list/question');
  const $ = load(response.data);
  const qna_table = $('.table-responsive tr:not(.success) td:first-child a');
  const qna_posts: TypePost[] = new Array(qna_table.length);
  for(let i = 0; i < qna_table.length; i++){
    let ele: Element = qna_table[i];
    qna_posts[i] = [$(ele).text(), "https://www.acmicpc.net" + ele.attribs.href, Number(ele.attribs.href.split('/').pop())];
  }
  return qna_posts;
};


const attr_to_language = (attr : string) => {
    console.log(attr);
  let db : {[name: string]: string} = {
    "text/x-c++src": "C++",
    "text/x-csrc": "C",
  };
  if(attr in db) return db[attr];
  else return attr.split('-')[1];
};

const get_discord_message = async (post: TypePost) => {
  console.log(`discord message : ${post}`);
  let response: { data: string } = await axios.get(post[1]);
  let $ = load(response.data);
  const description = $($('.post')[0]).text();
  const problem_id = Number($('.page-header a')[0].attribs.href.split('/').pop());
  let problem_level = solvedac_level[problem_id];

  let code : string[] = ["``` no code ```"];
  const text_area = $(".no-mathjax");
  if(text_area.length > 0){
    const language = attr_to_language(text_area[0].attribs["data-mime"]);
    let content: string[] = $(text_area[0]).text().split('\n');
    
    code[0] = "";
    for(let i = 0; i < content.length; i++){
      if(code[code.length - 1].length + content[i].length < 1000) code[code.length - 1] += content[i] + "\n";
      else code.push(content[i] + "\n");
    }
    for(let i = 0; i < code.length; i++){
      code[i] = "```" + language + "\n" + code[i] + "\n```";
    }
  }

  response = await axios.get(`https://www.acmicpc.net/problem/${problem_id}`);
  $ = load(response.data);
  let problem_title = $("#problem_title").text();

  let embeds: {title?: string, description?: string, color: number}[] = [{
    title: `${level_to_emoji(problem_level)} ${problem_id}번 ${problem_title}`,
    color: 0xFFFFFF
  },{
    title: `${post[0]}`,
    description: `${description}`,
    color: 0x66FF01
  }];

  for(let i = 0; i < code.length; i++){
    embeds.push({
      description: `${code[i]}`,
      color: 0x00CCFF
    });
  }

  return { 
    content: "BOJ 게시판",
    embeds: embeds,
    components: [{
      type: 1,
      components: [{
        type: 2,
        label: "BOJ에서 보기",
        style: 5,
        url: post[1]
      },{
        type: 2,
        label: "문제 보기",
        style: 5,
        url: `https://acmicpc.net/problem/${problem_id}`
      }],
    }]
  };
};

let last_index = config.last_qna_index;

const qna_update = async (qna_send: TypeSend) => {
  let qna_posts: TypePost[] = await get_qna_posts();
  let qna_length: number = qna_posts.length;
  for(let i = qna_length - 1; i >= 0; i--){
    if(last_index < qna_posts[i][2]){
      last_index = qna_posts[i][2];
      try{
        let content = await get_discord_message(qna_posts[i]);
        await qna_send(content);
      }catch(error){
        console.log(`send error on ${qna_posts[i][2]} by ${error}`);
      }
    }
  }
};

export default qna_update;
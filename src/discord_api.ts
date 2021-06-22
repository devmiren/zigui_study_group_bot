export type Emoji = {
  roles: string[];
  require_colons: boolean;
  name: string;
  managed: boolean;
  id: string;
  available: boolean;
  animated: boolean;
};

export type TYPE_GUILD_CREATE = {
  emojis: Emoji[];
};
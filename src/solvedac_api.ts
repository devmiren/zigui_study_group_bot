/*
type Tags = {
  algorithm_id: number;
  tag_name: string;
  full_name_en: string;
  short_name_en: string;
  full_name_ko: string;
  aliases: string;
};
type Problem = {
  id: number;
  level: number;
  level_locked: number;
  solvable: number;
  title: string;
  solved_count: number;
  average_try: number;
  tags: Tags[];
};
type Problems = {
  problems: Problem[];
};
export type SolvedacProblem = 
  | { success: true, result: Problems}
  | { success: false};
*/

import fs from 'fs';

export let emoji_id: {[name: string]: string} = {};

let tier: string = "bsgpdr";
export const level_to_emoji = (level: number) => {
  let emoji: string = "";
  if(level == 0) emoji = "unknown";
  else emoji = `${tier[(level-1)/5|0]}${5-(level-1)%5}`;
  return `<:${emoji}:${emoji_id[emoji]}>`;
};

export let solvedac_level: {[name: number]: number} = {};
export let solvedac_level_init = () => {
  let data = fs.readFileSync('solvedac_level_619.txt').toString();
  data.split('\n').forEach(problem => {
    if(problem.length === 0) return;
    let id: number = Number(problem.split(' ')[0]);
    let level: number = Number(problem.split(' ')[1]);
    solvedac_level[id] = level;
  });
}
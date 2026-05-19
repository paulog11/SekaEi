alter table custom_passages
  add column category text not null default 'custom'
    check (category in ('movies-tv', 'speeches', 'idioms', 'custom'));

create index custom_passages_user_category
  on custom_passages (user_id, category);

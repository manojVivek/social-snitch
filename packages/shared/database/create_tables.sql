create table notification_platform (
  id bigint not null primary key,
  created_at timestamp default now(),
  updated_at timestamp default now(),
  name character
);

create table social_platform (
  id bigint not null primary key,
  created_at timestamp default now(),
  updated_at timestamp default now(),
  name character
);

create table user (
  id bigint not null primary key,
  username character not null,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create table notification_config (
  id bigint not null primary key,
  created_at timestamp default now(),
  updated_at timestamp default now(),
  user_id bigint references user (id),
  notification_platform_id bigint references notification_platform (id),
  config jsonb
);

create table subscription (
  id bigint not null primary key,
  created_at timestamp default now(),
  updated_at timestamp default now(),
  user_id bigint references user (id)
);

create table watch_config (
  id bigint not null primary key,
  created_at timestamp default now(),
  updated_at timestamp default now(),
  keyword character,
  social_platform_id bigint references social_platform (id),
  last_run_at timestamp default now()
);

create table subscription_config (
  id bigint not null primary key,
  created_at timestamp default now(),
  updated_at timestamp default now(),
  subscription_id bigint references subscription (id),
  watch_config_id bigint references watch_config (id),
  notification_config_id bigint references notification_config (id)
);

create table notifications (
  id bigint not null primary key,
  created_at timestamp default now(),
  updated_at timestamp default now(),
  subscription_config_id bigint references subscription_config (id),
  content character,
  status character
);


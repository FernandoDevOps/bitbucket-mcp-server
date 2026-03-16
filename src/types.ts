/**
 * TypeScript interfaces for Bitbucket API responses
 */

export interface BitbucketRepository {
  name: string;
  full_name: string;
  uuid: string;
  is_private: boolean;
  description?: string;
}

export interface BitbucketBranch {
  name: string;
  target: {
    hash: string;
    message: string;
  };
}

export interface BitbucketTag {
  name: string;
  target: {
    hash: string;
    message: string;
    date: string;
  };
  tagger?: {
    user: {
      display_name: string;
      username: string;
    };
    date: string;
  };
}

export interface BitbucketCommit {
  hash: string;
  message: string;
  date: string;
  author: {
    raw: string;
    user?: {
      display_name: string;
      username: string;
      uuid: string;
    };
  };
  parents: Array<{
    hash: string;
  }>;
  links: {
    html: { href: string };
  };
}

export interface BitbucketPullRequest {
  id: number;
  title: string;
  description?: string;
  state: 'OPEN' | 'MERGED' | 'DECLINED';
  source: {
    branch: { name: string };
    repository: { full_name: string };
  };
  destination: {
    branch: { name: string };
    repository: { full_name: string };
  };
  author: {
    display_name: string;
    username: string;
  };
  created_on: string;
  updated_on: string;
  links: {
    html: { href: string };
  };
}

export interface BitbucketComment {
  id: number;
  content: {
    raw: string;
    html: string;
  };
  user: {
    display_name: string;
    username: string;
    uuid: string;
  };
  created_on: string;
  updated_on: string;
  links: {
    html: { href: string };
  };
  inline?: {
    from?: number;
    to?: number;
    path: string;
  };
}

export interface BitbucketDeployment {
  type: string;
  uuid: string;
  number: number;
  key: string;
  version?: number;
  created_on: string;
  state: {
    type: string;
    name: string;
    trigger_url?: string;
    triggerUrl?: string;
  };
  environment: {
    uuid: string;
  };
  step?: {
    uuid: string;
  };
  deployable: {
    type: string;
    uuid: string;
    pipeline: {
      uuid: string;
      type: string;
    };
    key: string;
    name: string;
    url: string;
    commit: {
      hash: string;
      links: {
        self: { href: string };
        html: { href: string };
      };
      type: string;
    };
    created_on: string;
  };
  release: {
    type: string;
    uuid: string;
    pipeline: {
      uuid: string;
      type: string;
    };
    key: string;
    name: string;
    url: string;
    commit: {
      hash: string;
      links: {
        self: { href: string };
        html: { href: string };
      };
      type: string;
    };
    created_on: string;
  };
}

import { PublicConfig } from '@roleplayx/engine-sdk';

export type ServerConfiguration = {
  [K in PublicConfig['key']]: Extract<PublicConfig, { key: K }>;
};

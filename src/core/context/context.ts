import { EngineClient, SessionTokenAuthorization } from '@roleplayx/engine-sdk';

import { GamemodeClient } from '../../gamemode/client';
import { ScreenType } from '../screen/screen-type';

export interface SessionContext {
  templateId: string;
  engineApiUrl: string;
  gamemodeApiUrl: string;
  serverId: string;
  sessionId: string;
  sessionToken: string;
  locale: string;
}

export function createEngineClient(context: SessionContext, screen: ScreenType) {
  return new EngineClient(
    {
      serverId: context.serverId,
      apiUrl: context.engineApiUrl,
      locale: context.locale,
      applicationName: `template:${context.templateId}:${screen}`,
    },
    new SessionTokenAuthorization(context.sessionId, context.sessionToken),
  );
}

export function createGamemodeClient(context: SessionContext) {
  return new GamemodeClient(
    {
      apiUrl: context.gamemodeApiUrl,
      locale: context.locale,
    },
    new SessionTokenAuthorization(context.sessionId, context.sessionToken),
  );
}

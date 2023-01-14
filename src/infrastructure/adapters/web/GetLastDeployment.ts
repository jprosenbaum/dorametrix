import { MikroLog } from 'mikrolog';
import { MikroMetric } from 'mikrometric';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

import { getLastDeployment } from '../../../usecases/getLastDeployment';

import { createNewDynamoDbRepository } from '../../repositories/DynamoDbRepository';

import { getRequestDTO } from '../../../application/getRequestDTO';

import { metadataConfig } from '../../../config/metadata';

/**
 * @description The controller for our service that handles getting the commit ID for the last deployment to production.
 */
export async function handler(
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  const logger = MikroLog.start({ metadataConfig, event, context });
  MikroMetric.start({
    namespace: metadataConfig.service,
    serviceName: metadataConfig.service,
    event,
    context
  });

  try {
    const input = getRequestDTO(event?.queryStringParameters as unknown as Record<string, string>);
    const repo = createNewDynamoDbRepository();
    const lastDeployment = await getLastDeployment(repo, input);

    return {
      statusCode: 200,
      body: JSON.stringify(lastDeployment)
    };
  } catch (error: any) {
    const statusCode: number = error?.['cause']?.['statusCode'] || 400;
    const message: string = error.message;
    logger.error(error);

    return {
      statusCode,
      body: JSON.stringify(message)
    };
  }
}
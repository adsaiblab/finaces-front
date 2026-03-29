import { IAPredictionOut, IAModelInfo } from '../models/ia.model';

export class IAMapper {
  static mergeModelInfo(
    prediction: IAPredictionOut,
    modelInfo: IAModelInfo
  ): IAPredictionOut & { model_performance: { auc_roc: number; accuracy: number; f1_score: number } } {
    return {
      ...prediction,
      model_performance: {
        auc_roc: modelInfo.auc_roc,
        accuracy: modelInfo.accuracy,
        f1_score: modelInfo.f1_score,
      },
    };
  }
}

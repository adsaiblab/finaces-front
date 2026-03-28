export class IAMapper {
  static mergeModelInfo(prediction: any, modelInfo: any) {
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

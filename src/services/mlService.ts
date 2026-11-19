import type { Dataset } from '../types/analysis';

export interface MlCapabilityDescriptor {
  id: 'predictive-regression' | 'kmeans-clustering' | 'anomaly-forest';
  title: string;
  subtitle: string;
  description: string;
  recommendedInputs: string;
  status: 'coming_soon';
}

export interface MlServiceAdapter {
  listCapabilities(): MlCapabilityDescriptor[];
  runPrediction(dataset: Dataset, targetColumn: string): Promise<never>;
  runClustering(dataset: Dataset, k: number): Promise<never>;
  runAnomalyDetection(dataset: Dataset): Promise<never>;
}

/**
 * Plug-in ML boundary for future scikit-learn / FastAPI / WebWorker models.
 */
export const mlService: MlServiceAdapter = {
  listCapabilities(): MlCapabilityDescriptor[] {
    return [
      {
        id: 'predictive-regression',
        title: 'Predictive Analytics & Forecasting',
        subtitle: 'Random Forest & Gradient Boosted Regressors',
        description:
          'Select any numeric or categorical target column to automatically train, cross-validate, and explain feature importances without writing model pipelines.',
        recommendedInputs: 'Requires 1 target column and 2+ numeric or categorical predictors',
        status: 'coming_soon',
      },
      {
        id: 'kmeans-clustering',
        title: 'Automated Segment Clustering',
        subtitle: 'K-Means & Silhouette Optimal Grouping',
        description:
          'Discover natural customer, product, or student cohorts across standardized numeric dimensions with automatic elbow-method cluster selection.',
        recommendedInputs: 'Requires 2+ continuous numeric columns',
        status: 'coming_soon',
      },
      {
        id: 'anomaly-forest',
        title: 'Multivariate Anomaly Detection',
        subtitle: 'Isolation Forest & Local Outlier Factor',
        description:
          'Move beyond single-column IQR bounds to spot subtle multi-variable anomalies across combinations of spend, margin, and timing.',
        recommendedInputs: 'Requires 50+ rows with numeric features',
        status: 'coming_soon',
      },
    ];
  },

  async runPrediction(): Promise<never> {
    throw new Error('Predictive Analytics ML adapter is not yet enabled.');
  },
  async runClustering(): Promise<never> {
    throw new Error('Clustering ML adapter is not yet enabled.');
  },
  async runAnomalyDetection(): Promise<never> {
    throw new Error('Multivariate Anomaly Detection ML adapter is not yet enabled.');
  },
};

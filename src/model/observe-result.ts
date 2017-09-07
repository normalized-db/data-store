export interface ObserveResult {
  action: 'put' | 'removed' | 'cleared';
  type: string;
  data?: any[];
}

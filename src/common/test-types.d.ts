// Loose JSON body shape for asserting on API responses in tests
export interface ApiBody {
  success: boolean;
  error?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
}

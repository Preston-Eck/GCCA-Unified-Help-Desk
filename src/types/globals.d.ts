
export {};

declare global {
  interface Window {
    google: {
      script: {
        run: {
          withSuccessHandler: (handler: (response: any) => void) => {
            withFailureHandler: (handler: (error: Error) => void) => any;
            [key: string]: any;
          };
          [key: string]: any;
        };
      };
    };
  }
}

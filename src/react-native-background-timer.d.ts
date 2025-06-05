declare module 'react-native-background-timer' {
  export default class BackgroundTimer {
    static setInterval(callback: () => void, delay: number): number;
    static clearInterval(id: number): void;
    static setTimeout(callback: () => void, delay: number): number;
    static clearTimeout(id: number): void;
    static start(delay?: number): void;
    static stop(): void;
  }
} 
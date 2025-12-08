declare module 'howler' {
  export class Howl {
    constructor(options: {
      src: string[];
      volume?: number;
      loop?: boolean;
      autoplay?: boolean;
      onload?: () => void;
      onplay?: () => void;
      onend?: () => void;
    });
    play(): void;
    pause(): void;
    stop(): void;
    volume(volume: number): void;
    loop(loop: boolean): void;
    once(event: string, callback: () => void): void;
  }

  export function HowlerGlobal(): void;
}

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
    play(): number;
    pause(id?: number): void;
    stop(id?: number): void;
    volume(volume: number, id?: number): void;
    loop(loop: boolean, id?: number): void;
    rate(rate: number, id?: number): void;
    once(event: string, callback: () => void, id?: number): void;
  }

  export function HowlerGlobal(): void;
}

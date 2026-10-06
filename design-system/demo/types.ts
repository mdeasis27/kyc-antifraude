export interface TraceEvent { id:string; step:number; kind:string; messageKey:string; timestampMs:number; evidenceIds?:string[]; }
export interface DemoRun<I,R> { input:I; result:R; trace:TraceEvent[]; executionMs:number; mode:'local'|'simulation'|'live'; }
export type DemoAdapter<I,R> = (input:I, signal:AbortSignal, onEvent:(event:TraceEvent)=>void)=>Promise<DemoRun<I,R>>;

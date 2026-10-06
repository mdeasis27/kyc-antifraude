"use client";
import {useEffect,useRef,useState,useCallback} from 'react';
import {RunGuard} from './run-guard';
import type {DemoAdapter,DemoRun,TraceEvent} from './types';
export function useDemoRun<I,R>(adapter:DemoAdapter<I,R>) {
 const guard=useRef(new RunGuard());
 const [run,setRun]=useState<DemoRun<I,R>|null>(null);
 const [trace,setTrace]=useState<TraceEvent[]>([]);
 const [running,setRunning]=useState(false);
 const [error,setError]=useState<string|null>(null);
 const cancel=useCallback(()=>{guard.current.cancel();setRunning(false);},[]);
 const reset=useCallback(()=>{cancel();setRun(null);setTrace([]);setError(null);},[cancel]);
 useEffect(()=>{const current=guard.current;return ()=>current.cancel();},[]);
 const execute=useCallback(async(input:I)=>{
  const token=guard.current.start();setRunning(true);setRun(null);setTrace([]);setError(null);
  try {const value=await adapter(input,token.signal,event=>{if(guard.current.isCurrent(token.id))setTrace(items=>[...items,event]);});if(guard.current.isCurrent(token.id)){setRun(value);setTrace(value.trace);}}
  catch(cause){if(guard.current.isCurrent(token.id))setError(cause instanceof Error?cause.message:'Execution failed');}
  finally{if(guard.current.isCurrent(token.id))setRunning(false);}
 },[adapter]);
 return {run,trace,running,error,execute,cancel,reset};
}

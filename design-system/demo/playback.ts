export interface PlaybackState<T> { trace:readonly T[]; visible:number; playing:boolean; }
export interface PlaybackFrame<T> { visible:number; total:number; event:T|undefined; complete:boolean; }
export function playbackFrame<T>(trace:readonly T[],visible:number):PlaybackFrame<T> {
 const count=Math.max(0,Math.min(Math.floor(visible),trace.length));
 return {visible:count,total:trace.length,event:trace[count-1],complete:trace.length>0&&count===trace.length};
}
export function currentPlayback<T>(state:PlaybackState<T>,trace:readonly T[]):PlaybackState<T> {
 return state.trace===trace?state:{trace,visible:1,playing:false};
}
/** Start playing a fresh trace on its own; a single step has nothing to play. */
export function autoPlayback<T>(state:PlaybackState<T>):PlaybackState<T> {
 return {...state,playing:state.trace.length>1};
}
export function advancePlayback<T>(state:PlaybackState<T>):PlaybackState<T> {
 const visible=Math.min(state.visible+1,state.trace.length);
 return {...state,visible,playing:visible<state.trace.length};
}

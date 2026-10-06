export class RunGuard {
 private generation=0;
 private controller:AbortController|null=null;
 start() { this.cancel(); this.controller=new AbortController(); return {id:this.generation,signal:this.controller.signal}; }
 cancel() { this.controller?.abort(); this.generation++; }
 isCurrent(id:number) { return id===this.generation && !this.controller?.signal.aborted; }
}

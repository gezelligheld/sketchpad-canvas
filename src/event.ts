class Event<T extends string> {
  listeners: { name: T; fns: ((...args: any[]) => void)[] }[] = [];

  on = (name: T, fn: (...args: any[]) => void) => {
    const target = this.listeners.find((l) => l.name === name);
    if (target) {
      target.fns.push(fn);
    } else {
      this.listeners.push({ name, fns: [fn] });
    }
  };

  off = (name: T, fn: (...args: any[]) => void) => {
    const target = this.listeners.find((l) => l.name === name);
    if (target) {
      const index = target.fns.indexOf(fn);
      if (index !== -1) {
        target.fns.splice(index, 1);
      }
    }
  };

  offAll = (name: T) => {
    const target = this.listeners.find((l) => l.name === name);
    if (target) {
      target.fns = [];
    }
  };

  emit = (name: T, data?: any) => {
    const target = this.listeners.find((l) => l.name === name);
    target?.fns.forEach((fn) => {
      fn(data);
    });
  };

  once = (name: T, fn: (...args: any[]) => void) => {
    const handle = () => {
      fn();
      this.off(name, handle);
    };
    this.on(name, handle);
  };
}

export default Event;

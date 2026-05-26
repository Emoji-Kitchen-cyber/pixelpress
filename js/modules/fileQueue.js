/**
 * FileQueue – Manages a list of files and provides progress tracking.
 */
export class FileQueue {
  constructor() {
    this.files = [];
    this.listeners = [];
  }

  addFiles(fileList) {
    const newFiles = Array.from(fileList).filter(f => f.type.startsWith('image/'));
    this.files.push(...newFiles);
    this.notify();
  }

  removeFile(index) {
    this.files.splice(index, 1);
    this.notify();
  }

  clear() {
    this.files = [];
    this.notify();
  }

  getAll() {
    return this.files;
  }

  get length() {
    return this.files.length;
  }

  onChange(callback) {
    this.listeners.push(callback);
  }

  notify() {
    this.listeners.forEach(cb => cb(this.files));
  }
}
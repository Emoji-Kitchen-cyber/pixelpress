/**
 * HistoryPanel – Simple undo/redo stack for image operations.
 */
export class HistoryPanel {
  constructor() {
    this.undoStack = [];
    this.redoStack = [];
  }

  // Add a new state (blob URL)
  push(blobUrl) {
    this.undoStack.push(blobUrl);
    this.redoStack = []; // clear redo on new action
  }

  undo() {
    if (this.undoStack.length <= 1) return null; // can't undo beyond initial
    const current = this.undoStack.pop();
    this.redoStack.push(current);
    return this.undoStack[this.undoStack.length - 1];
  }

  redo() {
    if (this.redoStack.length === 0) return null;
    const next = this.redoStack.pop();
    this.undoStack.push(next);
    return next;
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
  }
}
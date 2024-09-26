export class SequentialTaskHandler<T> {
  private taskMap: Map<number, Promise<T>> = new Map();

  async queueTask(userId: number, task: () => Promise<T>): Promise<T> {
    const previousTask =
      this.taskMap.get(userId) || Promise.resolve(null as any);

    // 새로운 작업을 이전 작업이 끝난 후에 실행
    const newTask = previousTask.then(() => task());
    this.taskMap.set(userId, newTask);

    // 작업 완료 후 제거
    return newTask.finally(() => {
      if (this.taskMap.get(userId) === newTask) {
        this.taskMap.delete(userId); // 작업 완료 후 제거
      }
    });
  }
}

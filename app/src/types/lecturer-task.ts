export interface LecturerTask {
  id: string
  text: string
  context: string | null
  dueDate: string | null // YYYY-MM-DD
  isDone: boolean
}

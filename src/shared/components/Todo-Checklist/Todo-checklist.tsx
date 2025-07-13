"use client"

import { useState } from "react"
import { Plus, X } from "lucide-react"
import { Button } from "../ui/button"
import { Checkbox } from "../ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Textarea } from "../ui/textarea"

interface TodoItem {
  id: string
  title: string
  details?: string
  completed: boolean
}

export default function TodoChecklist() {
  const [todos, setTodos] = useState<TodoItem[]>([
    {
      id: "1",
      title: "Book a hotel in Bangkok",
      details: "Budget limit — 25$/night • Dates 26-30 Nov",
      completed: false,
    },
    {
      id: "2",
      title: "Buy a train ticket to Hua Hin",
      completed: false,
    },
    {
      id: "3",
      title: "Book an apartment in Hua Hin",
      completed: true,
    },
  ])

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newDetails, setNewDetails] = useState("")

  const toggleTodo = (id: string) => {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    )
  }

  const addTodo = () => {
    if (newTitle.trim()) {
      const newTodo: TodoItem = {
        id: Date.now().toString(),
        title: newTitle.trim(),
        details: newDetails.trim() || undefined,
        completed: false,
      }
      setTodos((prev) => [...prev, newTodo])
      setNewTitle("")
      setNewDetails("")
      setIsDialogOpen(false)
    }
  }

  const deleteTodo = (id: string) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id))
  }

  return (
    <div className="w-full max-w-md mx-auto p-4">
      <div className="rounded-2xl p-6 shadow-md bg-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-black">To do</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="icon"
                className="h-8 w-8 rounded-full text-muted-foreground shadow-sm"
                variant="ghost"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Task Title</Label>
                  <Input
                    id="title"
                    placeholder="Enter task title..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="details">Details (optional)</Label>
                  <Textarea
                    id="details"
                    placeholder="Add any additional details..."
                    value={newDetails}
                    onChange={(e) => setNewDetails(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={addTodo} disabled={!newTitle.trim()}>
                    Add Task
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Scrollable Task List */}
        <div
          className="max-h-[260px] overflow-y-auto pr-1 space-y-3"
        >
          <style>{`
            ::-webkit-scrollbar {
              width: 3px;
            }
            ::-webkit-scrollbar-thumb {
              background: rgba(2, 0, 0, 0.3);
              border-radius: 9999px;
            }
            ::-webkit-scrollbar-track {
              background: transparent;
            }
          `}</style>

          {todos.map((todo) => (
            <div
              key={todo.id}
              className={`group flex items-start space-x-3 p-3 bg-white rounded-lg shadow-sm ${
                todo.completed ? "opacity-60" : ""
              }`}
            >
              <Checkbox
                id={todo.id}
                checked={todo.completed}
                onCheckedChange={() => toggleTodo(todo.id)}
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <label
                  htmlFor={todo.id}
                  className={`block font-semibold text-black cursor-pointer ${
                    todo.completed ? "line-through text-gray-400" : ""
                  }`}
                >
                  {todo.title}
                </label>
                {todo.details && (
                  <p
                    className={`text-sm text-gray-600 mt-1 ${
                      todo.completed ? "line-through" : ""
                    }`}
                  >
                    {todo.details}
                  </p>
                )}
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-muted-foreground hover:text-destructive"
                onClick={() => deleteTodo(todo.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>

        {todos.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">No tasks yet. Click the + button to add one!</p>
          </div>
        )}
      </div>
    </div>
  )
}

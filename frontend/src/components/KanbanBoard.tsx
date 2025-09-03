import { useEffect, useState } from "react";
import { Task } from "../types";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";
import { useSocketStore } from "@/state/socketStore";
import { useParams } from "react-router-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { PlusCircle, Trash2 } from "lucide-react";
import {
  createTask as createTaskService,
  deleteTask as deleteTaskService,
  reorderTasks as reorderTasksService,
} from "@/services/taskService";
import { useToast } from "./ui/use-toast";

interface Props {
  tasks: Task[];
  onTasksUpdate: (tasks: Task[]) => void;
}

const KanbanBoard = ({ tasks: initialTasks, onTasksUpdate }: Props) => {
  const { projectId } = useParams<{ projectId: string }>();
  const { socket } = useSocketStore();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const { toast } = useToast();

  const statuses: Task["status"][] = ["todo", "in-progress", "done"];

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  useEffect(() => {
    if (!socket) return;
    if (projectId) {
      socket.emit("project:join", projectId);
    }
    const handleTaskUpdate = (updatedTasks: Task[]) => {
      onTasksUpdate(updatedTasks);
    };
    socket.on("task:update", handleTaskUpdate);
    return () => {
      socket.off("task:update", handleTaskUpdate);
    };
  }, [socket, projectId, onTasksUpdate]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !projectId) return;

    const todoTasks = tasks.filter((t) => t.status === "todo");
    const newOrder = todoTasks.length;

    try {
      const newTaskData = {
        title: newTaskTitle,
        status: "todo" as const,
        order: newOrder,
      };
      const newTaskFromServer = await createTaskService(projectId, newTaskData);
      const updatedTasks = [...tasks, newTaskFromServer];
      onTasksUpdate(updatedTasks);
      setNewTaskTitle("");
      if (socket) {
        socket.emit("task:update", { projectId, tasks: updatedTasks });
      }
    } catch (error) {
      console.error("Failed to create task", error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;

    try {
      await deleteTaskService(taskId);
      const updatedTasks = tasks.filter((task) => task.id !== taskId);
      onTasksUpdate(updatedTasks);
      toast({ title: "Success", description: "Task deleted." });
      if (socket && projectId) {
        socket.emit("task:update", { projectId, tasks: updatedTasks });
      }
    } catch (error) {
      console.error("Failed to delete task", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not delete task.",
      });
    }
  };

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    // Filter tasks for each column based on the *current* state
    const startColumnTasks = tasks.filter(
      (t) => t.status === source.droppableId
    );
    const movedTask = startColumnTasks.find((t) => t.id === draggableId);
    if (!movedTask) return;

    // Create a new map of all tasks grouped by status
    const tasksByStatus: Record<string, Task[]> = {
      todo: tasks.filter((t) => t.status === "todo"),
      "in-progress": tasks.filter((t) => t.status === "in-progress"),
      done: tasks.filter((t) => t.status === "done"),
    };

    // 1. Remove the moved task from its source column
    const sourceTasks = tasksByStatus[source.droppableId];
    sourceTasks.splice(source.index, 1);

    // 2. Add the moved task to its destination column
    const destinationTasks = tasksByStatus[destination.droppableId];
    destinationTasks.splice(destination.index, 0, movedTask);

    // 3. Rebuild the final flat array of tasks, updating status and order
    const finalTasks: Task[] = [];
    statuses.forEach((status) => {
      tasksByStatus[status].forEach((task, index) => {
        finalTasks.push({
          ...task,
          status: status,
          order: index,
        });
      });
    });

    onTasksUpdate(finalTasks); // Optimistic UI update

    // Prepare payload for the backend
    const backendUpdatePayload = finalTasks.map(({ id, order, status }) => ({
      id,
      order,
      status,
    }));

    reorderTasksService(backendUpdatePayload)
      .then(() => {
        if (socket && projectId) {
          socket.emit("task:update", { projectId, tasks: finalTasks });
        }
      })
      .catch((err) => {
        console.error("Failed to reorder tasks", err);
        onTasksUpdate(tasks); // Revert on failure
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not save order.",
        });
      });
  };

  return (
    <div className="flex flex-col h-full">
      <form
        onSubmit={handleCreateTask}
        className="flex gap-2 mb-4 flex-shrink-0"
      >
        <Input
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          placeholder="Enter a new task title..."
        />
        <Button type="submit">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Task
        </Button>
      </form>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 flex-1 overflow-hidden">
          {statuses.map((status) => (
            <Droppable key={status} droppableId={status}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 p-2 rounded flex flex-col"
                >
                  <h3 className="font-bold mb-3 capitalize px-1 text-gray-800 dark:text-gray-200 flex-shrink-0">
                    {status.replace("-", " ")}
                  </h3>
                  <div className="flex-grow overflow-y-auto px-1">
                    {tasks
                      .filter((task) => task.status === status)
                      .sort((a, b) => a.order - b.order)
                      .map((task, index) => (
                        <Draggable
                          key={task.id}
                          draggableId={task.id.toString()}
                          index={index}
                        >
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="bg-white dark:bg-gray-800 p-3 rounded shadow mb-2 group relative"
                            >
                              <p className="font-medium text-gray-900 dark:text-gray-100">
                                {task.title}
                              </p>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100"
                                onClick={() => handleDeleteTask(task.id)}
                              >
                                <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-500" />
                              </Button>
                            </div>
                          )}
                        </Draggable>
                      ))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};

export default KanbanBoard;

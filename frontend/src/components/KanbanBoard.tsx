import { useState } from "react";
import { Task } from "../types";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { useProjectStore } from "@/state/projectStore";
import { useSocketStore } from "@/state/socketStore";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { PlusCircle, Trash2 } from "lucide-react";
import { createTask, deleteTask } from "@/services/taskService";
import { useToast } from "./ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const KanbanBoard = () => {
  const {
    tasks,
    reorderTasks: reorderTasksAction,
    activeProject,
  } = useProjectStore();
  const { roomStatus } = useSocketStore();
  const isCollaborationActive = roomStatus === "active";
  const { toast } = useToast();

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  const statuses: Task["status"][] = ["todo", "in-progress", "done"];

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !activeProject) return;

    setIsCreatingTask(true);
    try {
      await createTask(activeProject.id, { title: newTaskTitle });
      setNewTaskTitle("");
      toast({ title: "Task created." });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not create task.",
      });
    } finally {
      setIsCreatingTask(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!activeProject) return;
    try {
      await deleteTask(activeProject.id, taskId);
      toast({ title: "Task deleted." });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not delete task.",
      });
    }
  };

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (
      !destination ||
      (destination.droppableId === source.droppableId &&
        destination.index === source.index)
    ) {
      return;
    }

    const reordered = Array.from(tasks);
    const [movedTask] = reordered.splice(source.index, 1);
    reordered.splice(destination.index, 0, movedTask);

    const finalTasks = reordered.map((task, index) => ({
      ...task,
      status:
        task.id === draggableId
          ? (destination.droppableId as Task["status"])
          : task.status,
      order: index,
    }));

    reorderTasksAction(finalTasks);
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
          disabled={isCreatingTask}
        />
        <Button type="submit" disabled={isCreatingTask}>
          {isCreatingTask ? (
            "Adding..."
          ) : (
            <>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Task
            </>
          )}
        </Button>
      </form>

      {!isCollaborationActive && (
        <div className="text-center text-sm text-muted-foreground p-2 mb-4 bg-muted rounded-md">
          You are the only one here. Task updates will not be synced in
          real-time.
        </div>
      )}

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-dashed divide-gray-300 dark:divide-gray-600 border border-dashed border-gray-300 dark:border-gray-600 rounded-xl bg-background/50 backdrop-blur-sm">
          {statuses.map((status) => {
            const statusTasks = tasks
              .filter((task) => task.status === status)
              .sort((a, b) => a.order - b.order);

            return (
              <Droppable key={status} droppableId={status}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`
                      p-4 min-h-[500px] transition-colors
                      ${snapshot.isDraggingOver ? "bg-muted/50" : "hover:bg-muted/5"}
                      flex flex-col relative
                    `}
                    style={{
                      maxHeight: "calc(100vh - 200px)",
                      overflowY: "auto",
                    }}
                  >
                    <div className="flex justify-between items-center mb-6 px-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                          {status.replace("-", " ")}
                        </h3>
                      </div>
                      <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs font-medium border border-border">
                        {statusTasks.length}
                      </span>
                    </div>

                    <div className="flex flex-col gap-3">
                      {statusTasks.map((task, index) => (
                        <Draggable
                          key={task.id}
                          draggableId={task.id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{
                                ...provided.draggableProps.style,
                                opacity: snapshot.isDragging ? 0.7 : 1,
                              }}
                              className="bg-white dark:bg-gray-800 p-3 rounded shadow mb-2 group flex justify-between items-center gap-2"
                            >
                              <p className="font-medium text-gray-900 dark:text-gray-100 break-all">
                                {task.title}
                              </p>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 flex-shrink-0 opacity-0 group-hover:opacity-100"
                                  >
                                    <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-500" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Are you sure?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This action cannot be undone. This will
                                      permanently delete this task.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteTask(task.id)}
                                    >
                                      Continue
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>

                    {statusTasks.length === 0 && (
                      <div className="text-muted-foreground/40 text-center py-12 text-sm border-2 border-dashed border-border/50 rounded-lg m-2">
                        Drop here
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
};

export default KanbanBoard;

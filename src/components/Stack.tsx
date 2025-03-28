"use client";

import { useState } from "react";

import AudioInput from "./AudioInput";
import Recorder from "./Recorder";
import AddModule from "./AddModule";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  restrictToVerticalAxis,
  restrictToWindowEdges,
} from "@dnd-kit/modifiers";

import Distortion from "./Distortion";
import Delay from "./Delay";
import BitCrush from "./BitCrush";

import { GripHorizontal } from "lucide-react";

function SortableItem(props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    setActivatorNodeRef,
    isDragging,
  } = useSortable({ id: props.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1, // Hide the original while dragging
  };

  return (
    <div
      className="w-full bg-white relative rounded-3xl"
      ref={setNodeRef}
      style={style}
      {...attributes}
    >
      <div
        ref={setActivatorNodeRef}
        {...listeners}
        className="absolute left-1/2 transform -translate-x-1/2 mt-6"
      >
        <GripHorizontal className="text-gray-400" />
      </div>
      {props.children}
    </div>
  );
}

export interface AudioModuleProps {
  index: number;
  unregisterModule: Function;
}

export interface AudioModuleStateType {
  id: string;
  Component: AudioModuleComponent;
}

export type AudioModuleComponent = React.FC<AudioModuleProps>;

function Stack() {
  const [currentFile, setCurrentFile] = useState(null);
  const [fileIsAudio, setFileIsAudio] = useState(true);
  const [modules, setModules] = useState<AudioModuleStateType[]>([
    // Distortion,
    // BitCrush,
    // BitCrush,
    // BitCrush,
  ]);

  const [dragging, setDragging] = useState(false);

  const [activeId, setActiveId] = useState(null);
  const [activeModule, setActiveModule] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function registerModule(Module: AudioModuleComponent) {
    setModules((prev) => [
      ...prev,
      { id: crypto.randomUUID(), Component: Module },
    ]);
  }

  function unregisterModule(index: number) {
    setModules((prevModules) => prevModules.filter((_, i) => i !== index));
  }

  function handleDragStart(event) {
    if (!event.active) return;
    setActiveId(event.active.id);

    // Find the module being dragged
    const module = modules.find((m) => m.id === event.active.id);
    setActiveModule(module);
    setDragging(true);
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    setDragging(false);

    if (!active || !over || active.id === over.id) {
      setActiveId(null);
      return;
    }

    setModules((items) => {
      const oldIndex = items.findIndex((Module) => Module.id === active.id);
      const newIndex = items.findIndex((Module) => Module.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return items; // Prevent invalid moves

      return arrayMove(items, oldIndex, newIndex);
    });

    setActiveId(null);
  }

  return (
    <div className="flex flex-col gap-4 row-start-2 items-center sm:items-start w-2xl">
      <AudioInput
        currentFile={currentFile}
        setCurrentFile={setCurrentFile}
        fileIsAudio={fileIsAudio}
        setFileIsAudio={setFileIsAudio}
      />
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
        modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
      >
        <div
          className={
            dragging
              ? "bg-gray-200 w-full py-5 rounded-3xl transition-all flex flex-col gap-4"
              : "w-full rounded-3xl transition-all flex flex-col gap-4"
          }
        >
          <SortableContext
            items={modules}
            strategy={verticalListSortingStrategy}
          >
            {modules.map(({ id, Component }, i) => {
              return (
                <SortableItem key={id} id={id}>
                  <Component index={i} unregisterModule={unregisterModule} />
                </SortableItem>
              );
            })}
          </SortableContext>
        </div>
        <DragOverlay>
          {activeModule ? (
            <div className="w-full bg-white relative rounded-3xl opacity-50">
              <div className="absolute left-1/2 transform -translate-x-1/2 mt-6">
                <GripHorizontal className="text-gray-400" />
              </div>
              <activeModule.Component index={-1} unregisterModule={() => {}} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* {modules.length == 0 && ( */}
      <hr className="h-px w-full bg-gray-200 border-0 dark:bg-gray-700 rounded-2xl" />
      {/* )} */}
      <AddModule registerModule={registerModule} />
      <Recorder
        setCurrentFile={setCurrentFile}
        setFileIsAudio={setFileIsAudio}
      />
    </div>
  );
}

export default Stack;

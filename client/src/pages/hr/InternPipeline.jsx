import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { INTERN_STAGES } from '../../constants';
import Card from '../../components/ui/Card';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import { useInternStore } from '../../store/internStore';

const columnOrder = [
  INTERN_STAGES.APPLIED,
  INTERN_STAGES.SCREENING,
  INTERN_STAGES.INTERVIEW,
  INTERN_STAGES.OFFER,
  INTERN_STAGES.ONBOARDED,
  INTERN_STAGES.REJECTED,
];

export default function InternPipeline() {
  const { interns: storeInterns, loading, error, fetchInterns, updateStage } = useInternStore();
  const [data, setData] = useState({ columns: {}, interns: {}, columnOrder: [] });

  useEffect(() => {
    fetchInterns();
  }, [fetchInterns]);

  useEffect(() => {
    // Transform store data to Kanban format
    const columns = {
      [INTERN_STAGES.APPLIED]: { id: INTERN_STAGES.APPLIED, title: 'Applied', internIds: [] },
      [INTERN_STAGES.SCREENING]: { id: INTERN_STAGES.SCREENING, title: 'Screening', internIds: [] },
      [INTERN_STAGES.INTERVIEW]: { id: INTERN_STAGES.INTERVIEW, title: 'Interview', internIds: [] },
      [INTERN_STAGES.OFFER]: { id: INTERN_STAGES.OFFER, title: 'Offer', internIds: [] },
      [INTERN_STAGES.ONBOARDED]: { id: INTERN_STAGES.ONBOARDED, title: 'Onboarded', internIds: [] },
      [INTERN_STAGES.REJECTED]: { id: INTERN_STAGES.REJECTED, title: 'Rejected', internIds: [] },
    };
    const mappedInterns = {};
    storeInterns.forEach((intern) => {
      mappedInterns[intern.id] = intern;
      if (columns[intern.stage]) {
        columns[intern.stage].internIds.push(intern.id);
      } else {
        // Fallback to applied if missing or invalid stage
        columns[INTERN_STAGES.APPLIED].internIds.push(intern.id);
      }
    });
    
    setData({
      columns,
      interns: mappedInterns,
      columnOrder,
    });
  }, [storeInterns]);

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const start = data.columns[source.droppableId];
    const finish = data.columns[destination.droppableId];

    if (start === finish) {
      const newInternIds = Array.from(start.internIds);
      newInternIds.splice(source.index, 1);
      newInternIds.splice(destination.index, 0, draggableId);

      const newColumn = { ...start, internIds: newInternIds };
      setData({ ...data, columns: { ...data.columns, [newColumn.id]: newColumn } });
      return;
    }

    const startInternIds = Array.from(start.internIds);
    startInternIds.splice(source.index, 1);
    const newStart = { ...start, internIds: startInternIds };

    const finishInternIds = Array.from(finish.internIds);
    finishInternIds.splice(destination.index, 0, draggableId);
    const newFinish = { ...finish, internIds: finishInternIds };

    setData({
      ...data,
      columns: { ...data.columns, [newStart.id]: newStart, [newFinish.id]: newFinish },
    });
    
    // Update stage in backend
    await updateStage(draggableId, destination.droppableId);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-display text-primary">Intern Pipeline</h1>
        <p className="text-text-muted">Drag and drop interns to update stages and trigger AI workflows.</p>
      </div>

      <div className="flex-1 overflow-x-auto pb-4">
        {loading && Object.keys(data.interns).length === 0 ? (
          <div className="flex gap-4 h-full animate-pulse">
            {[1,2,3,4].map(i => <div key={i} className="w-72 bg-surface/50 border border-border rounded-lg h-96"></div>)}
          </div>
        ) : error ? (
          <div className="text-red-500">Failed to load intern data</div>
        ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-4 h-full items-start min-w-max">
            {data.columnOrder.map((columnId) => {
              const column = data.columns[columnId];
              const interns = column.internIds.map((id) => data.interns[id]);

              return (
                <div key={column.id} className="w-72 bg-surface/50 border border-border rounded-lg flex flex-col max-h-full">
                  <div className="p-3 border-b border-border flex items-center justify-between">
                    <h3 className="font-medium text-sm text-text-primary capitalize">{column.title}</h3>
                    <Badge variant="default">{interns.length}</Badge>
                  </div>
                  
                  <Droppable droppableId={column.id}>
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="flex-1 p-3 overflow-y-auto min-h-[150px] space-y-3"
                      >
                        {interns.map((intern, index) => (
                          <Draggable key={intern.id} draggableId={intern.id} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                              >
                                <Card className="p-3 cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors">
                                  <div className="flex items-center space-x-3 mb-2">
                                    <Avatar size="sm" alt={intern.name} />
                                    <div>
                                      <p className="text-sm font-medium text-text-primary">{intern.name}</p>
                                      <p className="text-xs text-text-muted">{intern.role}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between mt-3">
                                    <span className="text-xs text-text-muted">Score:</span>
                                    <Badge variant={intern.score > 80 ? 'success' : 'warning'}>{intern.score}/100</Badge>
                                  </div>
                                </Card>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
        )}
      </div>
    </div>
  );
}

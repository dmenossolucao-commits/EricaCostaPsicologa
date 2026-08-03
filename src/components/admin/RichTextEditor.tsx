import React from 'react';
import { WordEditor } from './WordEditor';

export { WordEditor };

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  title?: string;
  patientName?: string;
  patientPhone?: string;
  patientEmail?: string;
  patientId?: string;
  appointmentId?: string;
  initialMeetingLink?: string;
  autoSaveStatus?: 'saved' | 'saving' | 'idle';
  onSave?: () => void;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = (props) => {
  return <WordEditor {...props} />;
};

export default RichTextEditor;

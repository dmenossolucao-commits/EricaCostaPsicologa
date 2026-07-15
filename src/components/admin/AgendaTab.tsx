import React from 'react';
import { Save, Calendar, FileText, ChevronLeft, ChevronRight, Check, X, Ban, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Appointment } from '../../types';

interface DayAgenda {
  enabled: boolean;
  start: string;
  end: string;
}

interface AgendaTabProps {
  agendaSeg: DayAgenda;
  setAgendaSeg: (v: DayAgenda) => void;
  agendaTer: DayAgenda;
  setAgendaTer: (v: DayAgenda) => void;
  agendaQua: DayAgenda;
  setAgendaQua: (v: DayAgenda) => void;
  agendaQui: DayAgenda;
  setAgendaQui: (v: DayAgenda) => void;
  agendaSex: DayAgenda;
  setAgendaSex: (v: DayAgenda) => void;
  agendaSab: DayAgenda;
  setAgendaSab: (v: DayAgenda) => void;
  agendaDom: DayAgenda;
  setAgendaDom: (v: DayAgenda) => void;
  handleSaveWeeklyAgenda: () => void;
  agendaViewMode: 'weekly' | 'timeline';
  setAgendaViewMode: (v: 'weekly' | 'timeline') => void;
  apptFilter: 'all' | 'confirmed' | 'pending_payment' | 'cancelled';
  setApptFilter: (v: 'all' | 'confirmed' | 'pending_payment' | 'cancelled') => void;
  appointments: Appointment[];
  currentWeekOffset: number;
  setCurrentWeekOffset: (v: number | ((prev: number) => number)) => void;
  handleUpdateApptStatus: (id: string, status: 'confirmed' | 'cancelled') => void;
  blockDate: string;
  setBlockDate: (v: string) => void;
  blockTime: string;
  setBlockTime: (v: string) => void;
  handleAddBlock: (e: React.FormEvent) => void;
  blockedSlots: any[];
  handleRemoveBlock: (id: string) => void;
  getDayString: (dateStr: string) => string;
}

export default function AgendaTab({
  agendaSeg, setAgendaSeg,
  agendaTer, setAgendaTer,
  agendaQua, setAgendaQua,
  agendaQui, setAgendaQui,
  agendaSex, setAgendaSex,
  agendaSab, setAgendaSab,
  agendaDom, setAgendaDom,
  handleSaveWeeklyAgenda,
  agendaViewMode, setAgendaViewMode,
  apptFilter, setApptFilter,
  appointments,
  currentWeekOffset, setCurrentWeekOffset,
  handleUpdateApptStatus,
  blockDate, setBlockDate,
  blockTime, setBlockTime,
  handleAddBlock,
  blockedSlots,
  handleRemoveBlock,
  getDayString
}: AgendaTabProps) {
  return (
    <motion.div
      key="tab-agenda"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-8"
    >
      {/* Weekly setup */}
      <div className="bg-white p-6 rounded-2xl border border-sand-200 shadow-sm space-y-6">
        <div>
          <h3 className="text-sm font-serif font-bold text-sand-950">Grade Semanal de Atendimento Clínico</h3>
          <p className="text-xs text-sand-500 mt-1 leading-normal">Defina os dias da semana e intervalos de horários que você atende. Pacientes só poderão agendar nesses intervalos.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {[
            { label: 'Segunda-feira', state: agendaSeg, setState: setAgendaSeg },
            { label: 'Terça-feira', state: agendaTer, setState: setAgendaTer },
            { label: 'Quarta-feira', state: agendaQua, setState: setAgendaQua },
            { label: 'Quinta-feira', state: agendaQui, setState: setAgendaQui },
            { label: 'Sexta-feira', state: agendaSex, setState: setAgendaSex },
            { label: 'Sábado', state: agendaSab, setState: setAgendaSab },
            { label: 'Domingo', state: agendaDom, setState: setAgendaDom }
          ].map((day, idx) => (
            <div key={idx} className="p-4 rounded-xl border border-sand-150 bg-sand-50/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sand-900">{day.label}</span>
                <input
                  type="checkbox"
                  checked={day.state.enabled}
                  onChange={(e) => day.setState({ ...day.state, enabled: e.target.checked })}
                  className="h-4 w-4 text-sage-600 focus:ring-sage-500 border-sand-300 rounded"
                />
              </div>
              {day.state.enabled && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[9px] font-bold text-sand-500 uppercase font-mono">Início</span>
                    <input
                      type="text"
                      value={day.state.start}
                      onChange={(e) => day.setState({ ...day.state, start: e.target.value })}
                      className="w-full px-2 py-1 border border-sand-200 rounded text-xs focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-sand-500 uppercase font-mono">Fim</span>
                    <input
                      type="text"
                      value={day.state.end}
                      onChange={(e) => day.setState({ ...day.state, end: e.target.value })}
                      className="w-full px-2 py-1 border border-sand-200 rounded text-xs focus:outline-none font-mono"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-2 border-t border-sand-100">
          <button
            onClick={handleSaveWeeklyAgenda}
            className="px-5 py-2.5 bg-sage-600 hover:bg-sage-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Save size={13} />
            <span>Salvar Grade Semanal</span>
          </button>
        </div>
      </div>

      {/* Calendar, blocked and consultations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Calendar / Appointments list */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-sand-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-sand-100 pb-4">
            <div>
              <h3 className="text-sm font-serif font-bold text-sand-950">Quadro de Consultas</h3>
              <p className="text-[10px] text-sand-500 font-mono mt-0.5 uppercase tracking-wider">Gestão e Horários das Sessões</p>
            </div>
            
            <div className="flex items-center gap-2">
              {/* View Switcher */}
              <div className="bg-sand-50 border border-sand-200 rounded-xl p-0.5 flex">
                <button
                  onClick={() => setAgendaViewMode('weekly')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                    agendaViewMode === 'weekly'
                      ? 'bg-white text-sand-900 shadow-sm border border-sand-100'
                      : 'text-sand-500 hover:text-sand-900'
                  }`}
                >
                  <Calendar size={13} />
                  <span>Calendário Semanal</span>
                </button>
                <button
                  onClick={() => setAgendaViewMode('timeline')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                    agendaViewMode === 'timeline'
                      ? 'bg-white text-sand-900 shadow-sm border border-sand-100'
                      : 'text-sand-500 hover:text-sand-900'
                  }`}
                >
                  <FileText size={13} />
                  <span>Linha do Tempo</span>
                </button>
              </div>

              {/* Status Filter */}
              <select
                value={apptFilter}
                onChange={(e) => setApptFilter(e.target.value as any)}
                className="px-2.5 py-1.5 border border-sand-200 rounded-xl text-xs bg-white text-sand-800 font-mono focus:outline-none"
              >
                <option value="all">Filtro: Todos</option>
                <option value="confirmed">Confirmados</option>
                <option value="pending_payment">Aguardando Pix</option>
                <option value="cancelled">Cancelados</option>
              </select>
            </div>
          </div>

          {/* WEEKLY CALENDAR GRID VIEW */}
          {agendaViewMode === 'weekly' ? (() => {
            // Generate dates for current week offset
            const current = new Date();
            const day = current.getDay();
            const diff = current.getDate() - day + (day === 0 ? -6 : 1); // Monday
            const monday = new Date(current.setDate(diff));
            monday.setDate(monday.getDate() + currentWeekOffset * 7);

            const weekDays = [];
            for (let i = 0; i < 7; i++) {
              const d = new Date(monday);
              d.setDate(monday.getDate() + i);
              weekDays.push(d);
            }

            const weekLabel = `${weekDays[0].toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })} - ${weekDays[6].toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })}`;

            return (
              <div className="space-y-4">
                {/* Week Navigation bar */}
                <div className="flex items-center justify-between bg-sand-50/50 border border-sand-150 p-2 rounded-xl">
                  <button
                    onClick={() => setCurrentWeekOffset(prev => (prev as number) - 1)}
                    className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg text-sand-700 cursor-pointer transition-all"
                    title="Semana Anterior"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-xs font-semibold text-sand-850 font-mono tracking-wide uppercase">
                    {weekLabel}
                  </span>
                  <div className="flex gap-1">
                    {currentWeekOffset !== 0 && (
                      <button
                        onClick={() => setCurrentWeekOffset(0)}
                        className="px-2.5 py-1 hover:bg-white text-[10px] hover:shadow-sm font-bold uppercase rounded-lg text-softblue-700 cursor-pointer transition-all font-mono"
                      >
                        Hoje
                      </button>
                    )}
                    <button
                      onClick={() => setCurrentWeekOffset(prev => (prev as number) + 1)}
                      className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg text-sand-700 cursor-pointer transition-all"
                      title="Próxima Semana"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                {/* 7 Days Columns Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-7 gap-3 pt-2">
                  {weekDays.map((dateObj, dayIdx) => {
                    const dayName = dateObj.toLocaleDateString('pt-BR', { weekday: 'short' }).substring(0, 3).toUpperCase();
                    const dayNum = dateObj.getDate();
                    const isToday = new Date().toDateString() === dateObj.toDateString();

                    // Match appointments
                    const year = dateObj.getFullYear();
                    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                    const dayStr = String(dateObj.getDate()).padStart(2, '0');
                    const dateKey = `${year}-${month}-${dayStr}`;

                    const dayAppts = appointments.filter(a => 
                      a.date === dateKey && 
                      (apptFilter === 'all' || a.status === apptFilter)
                    ).sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));

                    return (
                      <div
                        key={dayIdx}
                        className={`rounded-2xl border p-3 min-h-[160px] space-y-2 flex flex-col ${
                          isToday
                            ? 'bg-softblue-50/20 border-softblue-200 shadow-sm'
                            : 'bg-white border-sand-150'
                        }`}
                      >
                        {/* Day Header */}
                        <div className="text-center pb-2 border-b border-sand-100 shrink-0">
                          <p className={`text-[9px] font-bold font-mono ${isToday ? 'text-softblue-700' : 'text-sand-400'}`}>
                            {dayName}
                          </p>
                          <p className={`text-base font-serif font-bold mt-0.5 ${isToday ? 'text-softblue-800' : 'text-sand-900'}`}>
                            {dayNum}
                          </p>
                        </div>

                        {/* Appointments list */}
                        <div className="space-y-2 flex-grow overflow-y-auto max-h-[180px] pr-0.5">
                          {dayAppts.length > 0 ? (
                            dayAppts.map((appt) => (
                              <div
                                key={appt.id}
                                className={`p-2 rounded-xl text-[10px] border leading-normal transition-all space-y-1 relative group ${
                                  appt.status === 'confirmed'
                                    ? 'bg-emerald-50/40 border-emerald-100 text-emerald-900'
                                    : appt.status === 'pending_payment'
                                    ? 'bg-amber-50/40 border-amber-100 text-amber-900'
                                    : 'bg-sand-50/50 border-sand-150 text-sand-500 line-through'
                                }`}
                              >
                                <div className="flex items-center justify-between font-mono font-bold">
                                  <span>{appt.timeSlot}</span>
                                  <span className={`h-1.5 w-1.5 rounded-full ${
                                    appt.status === 'confirmed'
                                      ? 'bg-emerald-500 animate-pulse'
                                      : appt.status === 'pending_payment'
                                      ? 'bg-amber-500'
                                      : 'bg-sand-400'
                                  }`} />
                                </div>
                                <p className="font-semibold truncate" title={appt.patientName}>
                                  {appt.patientName}
                                </p>
                                <p className="text-[8px] opacity-75 truncate">
                                  {appt.serviceTitle}
                                </p>

                                {/* Hover quick action overlay controls */}
                                <div className="absolute inset-0 bg-white/90 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 rounded-xl transition-all duration-200">
                                  {appt.status !== 'confirmed' && (
                                    <button
                                      onClick={() => handleUpdateApptStatus(appt.id, 'confirmed')}
                                      className="p-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-md border border-emerald-200 cursor-pointer"
                                      title="Confirmar"
                                    >
                                      <Check size={10} />
                                    </button>
                                  )}
                                  {appt.status !== 'cancelled' && (
                                    <button
                                      onClick={() => handleUpdateApptStatus(appt.id, 'cancelled')}
                                      className="p-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-md border border-rose-200 cursor-pointer"
                                      title="Cancelar"
                                    >
                                      <X size={10} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="h-full flex items-center justify-center text-[9px] text-sand-300 font-mono py-4 uppercase select-none">
                              Livre
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })() : (
            /* LINEAR TIMELINE LIST VIEW */
            <div className="divide-y divide-sand-100 max-h-[450px] overflow-y-auto pr-2">
              {appointments.filter(a => apptFilter === 'all' || a.status === apptFilter).length > 0 ? (
                appointments.filter(a => apptFilter === 'all' || a.status === apptFilter).map((appt) => (
                  <div key={appt.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 first:pt-0 last:pb-0">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${
                          appt.status === 'confirmed' ? 'bg-emerald-500' : appt.status === 'pending_payment' ? 'bg-amber-500' : 'bg-rose-400'
                        }`} />
                        <span className="text-xs font-bold text-sand-950">{appt.patientName}</span>
                      </div>
                      <p className="text-[10px] text-sand-500 mt-1 font-mono">{appt.serviceTitle} • {appt.patientEmail} • {appt.patientPhone}</p>
                    </div>
                    
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="px-2.5 py-1 rounded-lg bg-sand-50 border border-sand-150 text-[10px] font-mono font-bold text-sand-800">
                        {getDayString(appt.date)} às {appt.timeSlot}
                      </span>
                      
                      <div className="flex gap-1">
                        {appt.status !== 'confirmed' && (
                          <button
                            onClick={() => handleUpdateApptStatus(appt.id, 'confirmed')}
                            className="p-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-md border border-emerald-200 cursor-pointer transition-colors"
                            title="Confirmar Atendimento"
                          >
                            <Check size={12} />
                          </button>
                        )}
                        {appt.status !== 'cancelled' && (
                          <button
                            onClick={() => handleUpdateApptStatus(appt.id, 'cancelled')}
                            className="p-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-md border border-rose-200 cursor-pointer transition-colors"
                            title="Cancelar Consulta"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-sand-400 text-xs font-mono uppercase">
                  Nenhum agendamento encontrado para este filtro.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Exception blocks column */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-sand-200 shadow-sm space-y-4 h-fit">
          <h3 className="text-xs font-bold uppercase tracking-wider text-sand-900 font-mono">Bloquear Agenda / Férias</h3>
          
          <form onSubmit={handleAddBlock} className="space-y-3 pb-4 border-b border-sand-100">
            <div>
              <span className="text-[9px] font-bold text-sand-500 uppercase font-mono">Data</span>
              <input
                type="date"
                required
                value={blockDate}
                onChange={(e) => setBlockDate(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-sand-200 rounded-lg text-xs focus:outline-none"
              />
            </div>
            <div>
              <span className="text-[9px] font-bold text-sand-500 uppercase font-mono">Horário</span>
              <input
                type="time"
                required
                step="1800"
                value={blockTime}
                onChange={(e) => setBlockTime(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-sand-200 rounded-lg text-xs focus:outline-none font-mono"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-sand-900 hover:bg-sand-950 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 shadow-sm cursor-pointer"
            >
              <Ban size={12} />
              <span>Adicionar Bloqueio</span>
            </button>
          </form>

          <div className="space-y-2">
            <h4 className="text-[10px] font-bold uppercase text-sand-500 tracking-wider font-mono">Horários Bloqueados</h4>
            <div className="divide-y divide-sand-50 max-h-[180px] overflow-y-auto pr-1">
              {blockedSlots.length > 0 ? (
                blockedSlots.map((block) => (
                  <div key={block.id} className="py-2 flex items-center justify-between gap-2">
                    <span className="text-xs font-mono text-sand-800">
                      {getDayString(block.date)} • {block.timeSlot}
                    </span>
                    <button
                      onClick={() => handleRemoveBlock(block.id)}
                      className="p-1 hover:bg-rose-50 text-rose-600 rounded cursor-pointer"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-[10px] text-sand-400 font-mono uppercase">
                  Nenhum bloqueio ativo.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

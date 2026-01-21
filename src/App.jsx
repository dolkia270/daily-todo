import React, { useState, useEffect } from 'react';
import { Trash2, Infinity, Check, Send } from 'lucide-react';

export default function DailyTodoApp() {
  const [tasks, setTasks] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isPermanent, setIsPermanent] = useState(false);
  const [lastDate, setLastDate] = useState('');
  const [userName, setUserName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');
  const [draggedTask, setDraggedTask] = useState(null);
  const [hoveredTask, setHoveredTask] = useState(null);

  const isMobile = () => window.innerWidth < 640;

  // Date YYYY-MM-DD
  const getCurrentDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Date affichée
  const formatDate = () => {
    const now = new Date();
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    return `${days[now.getDay()]} ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
  };

  // Chargement initial (localStorage)
  useEffect(() => {
    const currentDate = getCurrentDate();

    const storedName = localStorage.getItem('todo-user-name');
    if (storedName) setUserName(storedName);

    const storedDate = localStorage.getItem('todo-last-date');
    const storedTasks = localStorage.getItem('todo-tasks');

    if (storedDate !== currentDate) {
      if (storedTasks) {
        const parsed = JSON.parse(storedTasks);
        const remaining = parsed
          .filter(t => !t.completed || t.permanent)
          .map(t => ({ ...t, completed: false }));

        setTasks(remaining);
        localStorage.setItem('todo-tasks', JSON.stringify(remaining));
      }
      localStorage.setItem('todo-last-date', currentDate);
      setLastDate(currentDate);
    } else {
      if (storedTasks) setTasks(JSON.parse(storedTasks));
      setLastDate(storedDate);
    }
  }, []);

  const saveTasks = (newTasks) => {
    localStorage.setItem('todo-tasks', JSON.stringify(newTasks));
  };

  const saveName = (name) => {
    localStorage.setItem('todo-user-name', name);
  };

  const addTask = () => {
    if (!inputValue.trim()) return;

    const newTasks = [
      ...tasks,
      {
        id: Date.now(),
        text: inputValue,
        completed: false,
        permanent: isPermanent
      }
    ];

    setTasks(newTasks);
    saveTasks(newTasks);
    setInputValue('');
    setIsPermanent(false);
  };

  const toggleTask = (id) => {
    const newTasks = tasks.map(t =>
      t.id === id ? { ...t, completed: !t.completed } : t
    );
    setTasks(newTasks);
    saveTasks(newTasks);
  };

  const deleteTask = (id) => {
    const newTasks = tasks.filter(t => t.id !== id);
    setTasks(newTasks);
    saveTasks(newTasks);
    setHoveredTask(null);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') addTask();
  };

  const startEditingName = () => {
    setTempName(userName);
    setIsEditingName(true);
  };

  const saveTempName = () => {
    setUserName(tempName);
    saveName(tempName);
    setIsEditingName(false);
  };

  const handleNameKeyPress = (e) => {
    if (e.key === 'Enter') saveTempName();
  };

  // Drag & drop
  const handleDragStart = (e, index) => {
    setDraggedTask(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedTask === null || draggedTask === index) return;

    const newTasks = [...tasks];
    const draggedItem = newTasks[draggedTask];
    newTasks.splice(draggedTask, 1);
    newTasks.splice(index, 0, draggedItem);

    setTasks(newTasks);
    setDraggedTask(index);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    saveTasks(tasks);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-6 sm:p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-4 sm:p-8">
        
        {/* Salutation */}
        <div className="mb-6 text-center">
          {isEditingName ? (
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl font-semibold text-gray-700">Bonjour,</span>
              <input
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onKeyPress={handleNameKeyPress}
                className="text-2xl font-semibold border-b-2 border-indigo-500 focus:outline-none px-2"
                autoFocus
              />
              <button onClick={saveTempName} className="text-green-600">
                <Check size={24} />
              </button>
            </div>
          ) : (
            <h2 className="text-2xl font-semibold text-gray-700">
              Bonjour,&nbsp;
              <span onClick={startEditingName} className="cursor-pointer hover:text-gray-900">
                {userName || 'ton prénom'}
              </span>
            </h2>
          )}
        </div>

        {/* Date */}
        <h1 className="text-xl font-bold text-gray-800 mb-6">{formatDate()}</h1>

        {/* Input */}
        <div className="mb-6 flex gap-2">
          <div className="flex-1 flex items-center gap-3 p-3 border-2 rounded-xl focus-within:border-indigo-500">
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="écris, fais, coche. c'es tout."
              className="flex-1 focus:outline-none"
            />
            <button onClick={() => setIsPermanent(!isPermanent)}>
              <Infinity className={isPermanent ? 'text-indigo-600' : 'text-gray-400'} />
            </button>
          </div>
          <button
            onClick={addTask}
            className="p-4 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600"
          >
            <Send size={20} />
          </button>
        </div>

        {/* Tasks */}
        <div className="space-y-3">
          {tasks.map((task, index) => (
            <div
              key={task.id}
              draggable={!isMobile()}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              onMouseEnter={() => setHoveredTask(task.id)}
              onMouseLeave={() => setHoveredTask(null)}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
            >
              <input type="checkbox" checked={task.completed} onChange={() => toggleTask(task.id)} />
              <span className={`flex-1 ${task.completed ? 'line-through text-gray-400' : ''}`}>
                {task.text}
              </span>
              {task.permanent && <Infinity size={16} className="text-indigo-500" />}
              {hoveredTask === task.id && (
                <button onClick={() => deleteTask(task.id)} className="text-red-500">
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          ))}
        </div>

        {tasks.length === 0 && (
          <p className="text-center text-gray-400 mt-8">
            t'as vrm rien à faire ajd ? chômeur
          </p>
        )}
      </div>
    </div>
  );
}

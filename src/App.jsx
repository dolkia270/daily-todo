import React, { useState, useEffect } from 'react';
import { Trash2, Infinity, Check } from 'lucide-react';

export default function DailyTodoApp() {
  const [tasks, setTasks] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isPermanent, setIsPermanent] = useState(false);
  const [lastDate, setLastDate] = useState('');
  const [userName, setUserName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');
  const [draggedTask, setDraggedTask] = useState(null);

  // Obtenir la date actuelle au format YYYY-MM-DD
  const getCurrentDate = () => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  };

  // Formater la date pour l'affichage
  const formatDate = () => {
    const now = new Date();
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    
    return `${days[now.getDay()]} ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
  };

  // Charger les données au démarrage
  useEffect(() => {
    const loadData = async () => {
      try {
        // Charger le nom
        const nameResult = await window.storage.get('todo-user-name');
        if (nameResult) {
          setUserName(nameResult.value);
        }

        const dateResult = await window.storage.get('todo-last-date');
        const tasksResult = await window.storage.get('todo-tasks');
        
        const currentDate = getCurrentDate();
        const storedDate = dateResult?.value || '';
        
        if (storedDate !== currentDate) {
          // Nouveau jour : nettoyer les tâches cochées non permanentes
          if (tasksResult) {
            const storedTasks = JSON.parse(tasksResult.value);
            const remainingTasks = storedTasks.filter(task => 
              !task.completed || task.permanent
            ).map(task => ({
              ...task,
              completed: false // Réinitialiser l'état de toutes les tâches
            }));
            setTasks(remainingTasks);
            await window.storage.set('todo-tasks', JSON.stringify(remainingTasks));
          }
          await window.storage.set('todo-last-date', currentDate);
          setLastDate(currentDate);
        } else {
          // Même jour : charger toutes les tâches
          if (tasksResult) {
            setTasks(JSON.parse(tasksResult.value));
          }
          setLastDate(storedDate);
        }
      } catch (error) {
        // Première utilisation
        const currentDate = getCurrentDate();
        setLastDate(currentDate);
        await window.storage.set('todo-last-date', currentDate);
      }
    };
    
    loadData();
  }, []);

  // Sauvegarder les tâches
  const saveTasks = async (newTasks) => {
    try {
      await window.storage.set('todo-tasks', JSON.stringify(newTasks));
    } catch (error) {
      console.error('Erreur de sauvegarde:', error);
    }
  };

  // Sauvegarder le nom
  const saveName = async (name) => {
    try {
      await window.storage.set('todo-user-name', name);
    } catch (error) {
      console.error('Erreur de sauvegarde du nom:', error);
    }
  };

  const addTask = () => {
    if (inputValue.trim()) {
      const newTasks = [...tasks, { 
        id: Date.now(), 
        text: inputValue, 
        completed: false,
        permanent: isPermanent
      }];
      setTasks(newTasks);
      saveTasks(newTasks);
      setInputValue('');
      setIsPermanent(false);
    }
  };

  const toggleTask = (id) => {
    const newTasks = tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    setTasks(newTasks);
    saveTasks(newTasks);
  };

  const deleteTask = (id) => {
    const newTasks = tasks.filter(task => task.id !== id);
    setTasks(newTasks);
    saveTasks(newTasks);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      addTask();
    }
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
    if (e.key === 'Enter') {
      saveTempName();
    }
  };

  // Fonctions de drag and drop
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
        {/* Salutation */}
        <div className="mb-6 text-center">
          {isEditingName ? (
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl font-semibold text-gray-700">Bonjour</span>
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onKeyPress={handleNameKeyPress}
                className="text-2xl font-semibold text-gray-700 border-b-2 border-indigo-500 focus:outline-none px-2"
                placeholder="votre prénom"
                autoFocus
              />
              <button
                onClick={saveTempName}
                className="text-green-600 hover:text-green-700 transition-colors"
              >
                <Check size={24} />
              </button>
            </div>
          ) : (
            <h2 className="text-2xl font-semibold text-gray-700">
              Bonjour <span 
                onClick={startEditingName}
                className="cursor-pointer hover:text-gray-900 transition-colors"
              >
                {userName || '[insérer prénom]'}
              </span>
            </h2>
          )}
        </div>

        {/* Date */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-800">{formatDate()}</h1>
        </div>

        {/* Champ de saisie avec option permanente */}
        <div className="mb-6">
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Écrivez vos tâches du jour"
              className="flex-1 p-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 text-gray-700 placeholder-gray-400"
            />
            <button
              onClick={() => setIsPermanent(!isPermanent)}
              className={`p-4 border-2 rounded-lg transition-all ${
                isPermanent 
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-600' 
                  : 'border-gray-300 text-gray-400 hover:border-indigo-300'
              }`}
              title="Tâche permanente"
            >
              <Infinity size={24} />
            </button>
          </div>
        </div>

        {/* Liste des tâches */}
        <div className="space-y-3">
          {tasks.map((task, index) => (
            <div
              key={task.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-move ${
                draggedTask === index ? 'opacity-50' : ''
              }`}
            >
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => toggleTask(task.id)}
                className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              />
              <span
                className={`flex-1 text-gray-800 ${
                  task.completed ? 'line-through text-gray-400' : ''
                }`}
              >
                {task.text}
              </span>
              {task.permanent && (
                <span className="text-indigo-500" title="Tâche permanente">
                  <Infinity size={18} />
                </span>
              )}
              <button
                onClick={() => deleteTask(task.id)}
                className="text-red-500 hover:text-red-700 transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>

        {tasks.length === 0 && (
          <p className="text-center text-gray-400 mt-8">Aucune tâche pour aujourd'hui</p>
        )}
      </div>
    </div>
  );
}



import { useEffect, useState } from "react";
import { 
    collection, 
    addDoc, 
    getDocs, 
    deleteDoc, 
    updateDoc, 
    doc, 
    query, 
    orderBy 
} from "firebase/firestore";
import { db } from "../../firebase"; // Asegúrate de que la ruta a firebase.ts sea correcta
import type { TodoType } from "./types";

export const useTodo = () => {
    const [todos, setTodos] = useState<TodoType[]>([]);
    const todosCollection = collection(db, "todos"); // Nombre de la colección en Firebase

    // CREAR TAREA
    const addTodo = async (todo: TodoType) => {
        try {
            // Guardamos en Firestore
            const docRef = await addDoc(todosCollection, {
                content: todo.content,
                done: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            
            // Actualizamos la lista local
            const newTodo = { ...todo, _id: docRef.id };
            setTodos([...todos, newTodo]);
        } catch (error) {
            console.error('Error adding todo:', error);
        }
    }

    // BORRAR TAREA
    const removeTodo = async (id: string) => {
        if (!id) return;
        try {
            await deleteDoc(doc(db, "todos", id));
            setTodos(todos.filter(todo => todo._id !== id));
        } catch (error) {
            console.error('Error removing todo:', error);
        }
    }

    // MARCAR COMO HECHA
    const markAsDone = async (id: string) => {
        if (!id) return;
        try {
            const todoRef = doc(db, "todos", id);
            await updateDoc(todoRef, {
                done: true,
                updatedAt: new Date().toISOString()
            });
            
            setTodos(todos.map(todo => 
                todo._id === id ? { ...todo, done: true } : todo
            ));
        } catch (error) {
            console.error('Error updating todo:', error);
        }
    }

    // CARGAR TAREAS AL INICIO
    useEffect(() => {
        const fetchTodos = async () => {
            try {
                // Traemos las tareas ordenadas por fecha
                const q = query(todosCollection, orderBy("createdAt", "asc"));
                const querySnapshot = await getDocs(q);
                
                const loadedTodos: TodoType[] = querySnapshot.docs.map(doc => ({
                    _id: doc.id,
                    content: doc.data().content,
                    done: doc.data().done,
                    createdAt: doc.data().createdAt,
                    updatedAt: doc.data().updatedAt
                }));
                
                setTodos(loadedTodos);
            } catch (error) {
                console.error('Error fetching todos:', error);
            }
        };

        fetchTodos();
    }, []);

    return { todos, addTodo, removeTodo, markAsDone }
}
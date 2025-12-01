import { useEffect, useState } from "react";
import { 
    collection, 
    addDoc, 
    onSnapshot, // Usamos onSnapshot para ver cambios en tiempo real
    deleteDoc, 
    updateDoc, 
    doc, 
    query, 
    where,      // Importante: Para filtrar
    orderBy 
} from "firebase/firestore";
import { db, auth } from "../../firebase"; // Asegúrate de importar auth
import type { TodoType } from "./types";

export const useTodo = () => {
    const [todos, setTodos] = useState<TodoType[]>([]);
    const todosCollection = collection(db, "todos");

    // CREAR TAREA (Con sello de propiedad)
    const addTodo = async (todo: TodoType) => {
        if (!auth.currentUser) return; // Si no hay usuario, no guardar

        try {
            await addDoc(todosCollection, {
                content: todo.content,
                done: false,
                uid: auth.currentUser.uid, // <--- ESTO ES LA CLAVE (Guardamos el ID del dueño)
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            // No hace falta actualizar el estado manual, onSnapshot lo hará solo
        } catch (error) {
            console.error('Error adding todo:', error);
        }
    }

    // BORRAR TAREA
    const removeTodo = async (id: string) => {
        if (!id) return;
        try {
            await deleteDoc(doc(db, "todos", id));
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
        } catch (error) {
            console.error('Error updating todo:', error);
        }
    }

    // CARGAR TAREAS (Solo las mías)
    useEffect(() => {
        // Si no hay usuario logueado, no cargamos nada
        if (!auth.currentUser) {
            setTodos([]);
            return;
        }

        // Consulta: Dame las tareas DONDE el 'uid' sea igual a MI id
        const q = query(
            todosCollection, 
            where("uid", "==", auth.currentUser.uid), 
            orderBy("createdAt", "asc")
        );

        // Suscripción en tiempo real (si abres dos pestañas, se actualizan ambas)
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const loadedTodos: TodoType[] = snapshot.docs.map(doc => ({
                _id: doc.id,
                content: doc.data().content,
                done: doc.data().done,
                createdAt: doc.data().createdAt,
                updatedAt: doc.data().updatedAt
            }));
            setTodos(loadedTodos);
        });

        return () => unsubscribe(); // Limpieza al salir
    }, []); // Se ejecuta al montar

    return { todos, addTodo, removeTodo, markAsDone }
}
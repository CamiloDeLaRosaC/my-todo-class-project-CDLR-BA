import { useEffect, useState } from "react";
import { 
    collection, 
    addDoc, 
    onSnapshot, 
    deleteDoc, 
    updateDoc, 
    doc, 
    query, 
    where,      
    orderBy 
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth"; // <--- IMPORTANTE
import { db, auth } from "../../firebase"; 
import type { TodoType } from "./types";

export const useTodo = () => {
    const [todos, setTodos] = useState<TodoType[]>([]);
    const todosCollection = collection(db, "todos");

    // CREAR TAREA
    const addTodo = async (todo: TodoType) => {
        if (!auth.currentUser) {
            console.error("No hay usuario logueado, no se puede guardar.");
            return;
        }

        try {
            await addDoc(todosCollection, {
                content: todo.content,
                done: false,
                uid: auth.currentUser.uid, // Guardamos con tu firma
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
        } catch (error) {
            console.error('ERROR GRAVE al guardar en Firebase:', error);
            alert("No se pudo guardar la tarea. Revisa la consola (F12) para ver el error.");
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

    // CARGAR TAREAS (SOLO LAS TUYAS y ESPERANDO AUTH)
    useEffect(() => {
        // Esta función escucha los cambios de sesión (Login/Logout/Refresh)
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (user) {
                // ¡Usuario detectado! Ahora sí pedimos sus datos
                console.log("Usuario autenticado:", user.email);
                
                const q = query(
                    todosCollection, 
                    where("uid", "==", user.uid), // Filtro de seguridad
                    orderBy("createdAt", "asc")
                );

                // Suscripción a la base de datos
                const unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
                    const loadedTodos: TodoType[] = snapshot.docs.map(doc => ({
                        _id: doc.id,
                        content: doc.data().content,
                        done: doc.data().done,
                        createdAt: doc.data().createdAt,
                        updatedAt: doc.data().updatedAt
                    }));
                    setTodos(loadedTodos);
                }, (error) => {
                    console.error("Error de Permisos/Red al leer tareas:", error);
                });

                return () => unsubscribeSnapshot();
            } else {
                // No hay usuario, limpiamos la lista
                setTodos([]);
            }
        });

        // Limpieza al desmontar
        return () => unsubscribeAuth();
    }, []); 

    return { todos, addTodo, removeTodo, markAsDone }
}
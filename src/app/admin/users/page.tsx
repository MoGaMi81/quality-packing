"use client";

import { useEffect, useState } from "react";

type User = {
  id:string
  email:string
  name:string
  role:string
  active:boolean
}

export default function AdminUsers(){

 const [users,setUsers] = useState<User[]>([])

 async function load(){

  const r = await fetch("/api/admin/users/list")
  const d = await r.json()

  if(d.ok){
    setUsers(d.users)
  }

 }

 useEffect(()=>{
  load()
 },[])

 return(

 <main className="p-6 space-y-6">

  <h1 className="text-2xl font-bold">
   Usuarios
  </h1>

  <table className="w-full border">

   <thead className="bg-gray-100">
    <tr>
     <th>Email</th>
     <th>Nombre</th>
     <th>Rol</th>
     <th>Activo</th>
    </tr>
   </thead>

   <tbody>

    {users.map(u=>(
     <tr key={u.id}>
      <td>{u.email}</td>
      <td>{u.name}</td>
      <td>{u.role}</td>
      <td>{u.active ? "SI":"NO"}</td>
     </tr>
    ))}

   </tbody>

  </table>

 </main>

 )

}
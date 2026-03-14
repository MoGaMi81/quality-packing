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

  <button
 onClick={async()=>{

  const email = prompt("Email");
  const password = prompt("Password");
  const name = prompt("Nombre");
  const role = prompt("Rol (admin/proceso/facturacion)");

  await fetch("/api/admin/users/create",{
   method:"POST",
   headers:{ "Content-Type":"application/json" },
   body:JSON.stringify({
     email,
     password,
     name,
     role
   })
  });

  location.reload();
 }}
>
Crear usuario
</button>

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

<td>
<select
 defaultValue={u.role}
 onChange={async e=>{
  await fetch("/api/admin/users/update",{
    method:"PATCH",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({
      id:u.id,
      role:e.target.value,
      active:u.active
    })
  })
 }}
>
<option value="admin">admin</option>
<option value="proceso">proceso</option>
<option value="facturacion">facturacion</option>
</select>
</td>

<td>

<button
 onClick={async ()=>{
  await fetch("/api/admin/users/update",{
   method:"PATCH",
   headers:{ "Content-Type":"application/json" },
   body:JSON.stringify({
    id:u.id,
    role:u.role,
    active:!u.active
   })
  })
 }}
>
 {u.active ? "Activo":"Inactivo"}
</button>

</td>

<td>

<button
 style={{color:"red"}}
 onClick={async ()=>{
  if(!confirm("Eliminar usuario?")) return;

  await fetch("/api/admin/users/delete",{
   method:"DELETE",
   headers:{ "Content-Type":"application/json" },
   body:JSON.stringify({ id:u.id })
  })
 }}
>
Eliminar
</button>

</td>

</tr>
))}

</tbody>

  </table>

 </main>

 )

}
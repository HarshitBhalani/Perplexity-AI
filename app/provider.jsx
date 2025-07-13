// provider component for user details
"use client"
import { UserDetailContext } from '@/context/UserDetailContext';
import { supabase } from '@/services/supabase';
// import { useUser } from '@clerk/nextjs';
import { User } from 'lucide-react';
import React, { use, useEffect, useState } from 'react'

const Provider = ({ children }) => {
    // Clerk removed. Define your own user logic if needed.
    const [userDetail,setUserDetail] = useState();

    useEffect(() => {
        // Add your own user logic here if needed.
    }, []);

    const CreateNewUser = async () => {
        // Add your own user creation logic here if needed.
    }
    return (
        <UserDetailContext.Provider value={{userDetail,setUserDetail}}>
            <div className='w-full'>{children}</div> 
        </UserDetailContext.Provider>

    )
}

export default Provider

"use client"
import React from 'react'
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarHeader, SidebarMenu, SidebarButton, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import Image from 'next/image';
import { Compass, GalleryHorizontalEnd, Search, Wrench } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';

// Clerk removed. Replace with your own user logic or context.

function AppSidebar() {
    const path = usePathname();
    const MenuOptions = [
        {
            title: 'Home',
            icon: Search,
            path: '/',
            isActive: true
        },
        {
            title: 'Discover',
            icon: Compass,
            path: '/',
            isActive: false,
            workInProgress: true
        },
        {
            title: 'Library',
            icon: GalleryHorizontalEnd,
            path: '/',
            isActive: false,
            workInProgress: true
        },
    ];

    return (
        <Sidebar>
            <SidebarHeader className="p-4">
                <Image 
                    src="/logo.png" 
                    alt="Logo" 
                    width={120} 
                    height={120} 
                    className="mx-auto"
                />
            </SidebarHeader>
            
            <SidebarContent className="px-3">
                <SidebarGroup>
                    <SidebarMenu className="space-y-2">
                        {MenuOptions.map((menu, index) => (
                            <SidebarMenuItem key={index}>
                                <SidebarMenuButton 
                                    asChild 
                                    className={`${menu.workInProgress ? 'opacity-70 cursor-not-allowed bg-muted/50' : 'hover:bg-primary hover:text-primary-foreground active:bg-primary/90'} transition-all duration-200 ease-in-out transform hover:scale-[1.02] py-3 px-4 rounded-lg`}
                                    disabled={menu.workInProgress}
                                >
                                    <div className="flex items-center gap-4 w-full">
                                        <menu.icon className="w-6 h-6" />
                                        <span className="flex-1 font-medium text-base">{menu.title}</span>
                                        {menu.workInProgress && (
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 rounded-full">
                                                <Wrench className="w-3 h-3" />
                                                <span className="font-medium">WIP</span>
                                            </div>
                                        )}
                                    </div>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                <div className="text-center text-sm text-muted-foreground py-4 border-t">
                    <span className="font-medium">Created by Harshit Bhalani</span>
                </div>
            </SidebarFooter>
        </Sidebar>
    );
}

export default AppSidebar;
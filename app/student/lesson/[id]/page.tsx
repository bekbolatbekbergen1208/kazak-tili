import {notFound} from 'next/navigation';import GenericLesson from '@/components/generic-lesson';import {getLesson} from '@/lib/curriculum';
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;const lesson=getLesson(Number(id));if(!lesson)notFound();return <GenericLesson lesson={lesson}/>}

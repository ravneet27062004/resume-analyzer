import Navbar from "~/components/Navbar";
import type { Route } from "./+types/home";
import {resumes} from "../../constants/index";
import ResumeCard from "~/components/ResumeCard";
import { usePuterStore } from "~/lib/puter";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
export function meta({}: Route.MetaArgs) {
  return [
    { title: "Analyzer" },
    { name: "description", content: "Analyze your resume with our powerful tools." },
  ];
}

export default function Home() {
 const {auth}
    =usePuterStore();
const location=useLocation();

const navigate=useNavigate();
useEffect(()=>{
    if(!auth.isAuthenticated)navigate('/auth?next=/')
    },[auth.isAuthenticated])



  return <main className="bg-[url('/images/bg-main.svg')] bg-cover">
    <Navbar />
    {/* {window.puter.ai.chat()} */}
    
    <section className="main-section">
      <div className="page-heading">
        <h1>Track Your Applications & Resume Ratings</h1>
        <h2>
          Review your submissions and get AI-powered feedback.
        </h2>
      </div>
      
    
    {resumes.length > 0 && (
      <div className="resumes-section">
         { 
      resumes.map((resume )=>(
        <ResumeCard key={resume.id} resume={resume} />
      ))
    }
      </div>
    )}
    
   </section>
  </main>;
}

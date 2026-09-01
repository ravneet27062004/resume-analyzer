import Navbar from "~/components/Navbar";
import type { Route } from "./+types/home";
import { Link } from "react-router";
import ResumeCard from "~/components/ResumeCard";
import { usePuterStore } from "~/lib/puter";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
export function meta({}: Route.MetaArgs) {
  return [
    { title: "Analyzer" },
    { name: "description", content: "Analyze your resume with our powerful tools." },
  ];
}

export default function Home() {
 const {auth,fs,kv}
    =usePuterStore();


const navigate=useNavigate();
const [resumes,setresumes]=useState<Resume[]>([])
const [loading,setloading]=useState(false)


useEffect(()=>{
    if(!auth.isAuthenticated)navigate('/auth?next=/')
    },[auth.isAuthenticated])

    useEffect(()=>{
      const loadresume=async()=>{
setloading(true);

const resumes=(await kv.list('resume:*',true))  as KVItem[];
          
const parsedresume=resumes?.map((resume)=>(
  JSON.parse(resume.value) as Resume
)

)
console.log("parsedresume",parsedresume);
setresumes(parsedresume||[]);
setloading(false);
      }
      loadresume();
    },[])



  return <main className="bg-[url('/images/bg-main.svg')] bg-cover">
    <Navbar />
    {/* {window.puter.ai.chat()} */}
    
    <section className="main-section">
      <div className="page-heading">
        <h1>Track Your Applications & Resume Ratings</h1>
        {!loading && resumes.length==0 ?(
          <h2>No Resume Found .Upload your  First Resume.</h2>
        ):(
          <h2>Review your submissions and check AI-powered feedback.</h2>
        )}
        <h2>
          Review your submissions and get AI-powered feedback.
        </h2>
        
      </div>
       {loading && (
          <div className="flex flex-col items-center justify-center">
            <img src="/images/resume-scan-2.gif" className="w-[200px]" />
          </div>
      )}

      
    
    {!loading && resumes.length > 0 && (
      <div className="resumes-section">
         { 
      resumes.map((resume )=>(
        <ResumeCard key={resume.id} resume={resume} />
      ))
    }
      </div>
    )}
     {!loading && resumes?.length === 0 && (
          <div className="flex flex-col items-center justify-center mt-10 gap-4">
            <Link to="/upload" className="primary-button w-fit text-xl font-semibold">
              Upload Resume
            </Link>
          </div>
      )}
    
   </section>
  </main>;
}

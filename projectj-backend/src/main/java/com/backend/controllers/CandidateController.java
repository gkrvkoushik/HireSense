package com.backend.controllers;

import com.backend.entities.Application;
import com.backend.entities.Candidate;
import com.backend.entities.Job;
import com.backend.entities.Response;
import com.backend.repositories.CandidateRepository;
import com.backend.services.CandidateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;

//apply-job
//view-all-jobs
//view-all-applications
//update-resume
class ApplicationDoesNotExistsException extends Exception {
    public ApplicationDoesNotExistsException() {
    }
    public ApplicationDoesNotExistsException(String message) {
        super(message);
    }
}


@RestController
@RequestMapping("/candidate")
public class CandidateController {

    @Autowired
    private CandidateService candidateService;


    @PostMapping("/apply-job/{candidate_id}/{job_id}")
    public Response<Application> applyJob(@PathVariable("candidate_id") int candidate_id, @PathVariable("job_id") int job_id) {
        Application application = null;
        try{
            application=candidateService.applyForJob(candidate_id,job_id);
            if(null == application){
                throw new ApplicationDoesNotExistsException("Application doesn't exists");
            }
        }catch(ApplicationDoesNotExistsException e){
            return Response.<Application>builder().message("Application not found").statusCode(400).data(application).build();
        }catch(Exception e){
            return Response.<Application>builder().message("Unexpected error").statusCode(500).data(application).build();
        }
        return Response.<Application>builder().message("Application applied").statusCode(200).data(application).build();
    }

    @GetMapping("/get-all-jobs")
    public Response<List<Job>> getAllJobs(){
        List<Job> jobs = candidateService.getAllJobs();
        if(jobs.isEmpty()){
            return Response.<List<Job>>builder().message("No jobs found").statusCode(400).data(null).build();
        }
        //simulateDBCall();
        return Response.<List<Job>>builder().message("Jobs found").statusCode(200).data(jobs).build();
    }

    @GetMapping("get-all-applications/{candidate_id}")
    public  Response<List<Application>> getAllApplications(@PathVariable("candidate_id") int candidate_id){
        List<Application> applications = candidateService.getAllApplications(candidate_id);
        if(applications.isEmpty()){
            return Response.<List<Application>>builder().message("No Job Applications found").statusCode(400).data(null).build();
        }
        return Response.<List<Application>>builder().message("Job Applications found").statusCode(200).data(applications).build();
    }

    @GetMapping("/profile")
    public Response<Candidate> getProfile() {
        String email = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        Candidate candidate = candidateService.getProfile(email);
        if (candidate == null) {
            return Response.<Candidate>builder().message("Profile not found").statusCode(400).data(null).build();
        }
        return Response.<Candidate>builder().message("Profile found").statusCode(200).data(candidate).build();
    }

    private void simulateDBCall(){
        try{
            System.out.println("Thread Name :"+Thread.currentThread().getName());
            System.out.println("Thread ID :"+Thread.currentThread().getId());
            Thread.sleep(500);

        }catch(Exception e){
            Thread.currentThread().interrupt();

            e.printStackTrace();
        }
    }

}

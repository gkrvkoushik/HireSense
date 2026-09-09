package com.backend.services;

import com.backend.entities.Application;
import com.backend.entities.ApplicationStatus;
import com.backend.entities.Candidate;
import com.backend.entities.Job;
import com.backend.repositories.ApplicationRepository;
import com.backend.repositories.CandidateRepository;
import com.backend.repositories.JobRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;

@Service
public class CandidateService {

    @Autowired
    private CandidateRepository candidateRepository;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private ApplicationRepository applicationRepository;

//    public Candidate registerCandicate(){
//
//    }

    private final RedisTemplate<String, Object> redisTemplate;

    public CandidateService(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    private static final String JOBS_KEY_CACHE="jobs:all";

    public Application applyForJob(int candidate_id, int job_id){
        Candidate candidate = candidateRepository.findById(candidate_id).orElse(null);
        if(null == candidate){
            return null;
        }
        Job job=jobRepository.findById(job_id).orElse(null);
        if(null == job){
            return null;
        }

        Application application = new Application();
        application.setCandidate(candidate);
        application.setJob(job);
        application.setApplicationStatus(ApplicationStatus.APPLIED);
        application.setResumeUrl(candidate.getResumeUrl());

        return applicationRepository.save(application);
    }


    public List<Job> getAllJobs(){
        try {
            Object cachedJobs = redisTemplate.opsForValue().get(JOBS_KEY_CACHE);

            if (cachedJobs != null) {
                System.out.println("========== REDIS CACHE HIT ==========");
                System.out.println("Key: " + JOBS_KEY_CACHE);
                return (List<Job>) cachedJobs;
            }

            System.out.println("========== REDIS CACHE MISS ==========");
        } catch (Exception e) {
            System.err.println("Redis cache read failed, falling back to DB: " + e.getMessage());
        }

        List<Job> jobs = jobRepository.findAll();

        // Convert Hibernate PersistentBags to plain ArrayLists for Redis serialization safety!
        List<Job> cleanJobs = new java.util.ArrayList<>();
        for (Job job : jobs) {
            Job cleanJob = new Job();
            cleanJob.setId(job.getId());
            cleanJob.setRole(job.getRole());
            cleanJob.setDescription(job.getDescription());
            cleanJob.setSkills(job.getSkills() != null ? new java.util.ArrayList<>(job.getSkills()) : null);
            cleanJob.setExperience(job.getExperience());
            cleanJob.setPostedAt(job.getPostedAt());
            cleanJob.setRecruiter(job.getRecruiter());
            
            if (job.getApplications() != null) {
                List<Application> cleanApps = new java.util.ArrayList<>();
                for (Application app : job.getApplications()) {
                    Application cleanApp = new Application();
                    cleanApp.setId(app.getId());
                    cleanApp.setApplicationStatus(app.getApplicationStatus());
                    cleanApp.setResumeUrl(app.getResumeUrl());
                    cleanApp.setAppliedAt(app.getAppliedAt());
                    cleanApps.add(cleanApp);
                }
                cleanJob.setApplications(cleanApps);
            } else {
                cleanJob.setApplications(new java.util.ArrayList<>());
            }
            cleanJobs.add(cleanJob);
        }

        try {
            redisTemplate.opsForValue().set(JOBS_KEY_CACHE, cleanJobs, Duration.ofMinutes(10));
            System.out.println("========== REDIS CACHE SET ==========");
            System.out.println("Key: " + JOBS_KEY_CACHE);
            System.out.println("TTL: 10 minutes");
        } catch (Exception e) {
            System.err.println("Redis cache write failed: " + e.getMessage());
        }
        return jobs;
    }


    public List<Application> getAllApplications(int candidate_id){
        return applicationRepository.findByCandidateId(candidate_id);
    }

    public Candidate getProfile(String email) {
        return candidateRepository.findByEmail(email);
    }

}

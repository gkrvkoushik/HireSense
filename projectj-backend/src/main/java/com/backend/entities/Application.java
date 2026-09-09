package com.backend.entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.CreationTimestamp;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDateTime;

@Entity
@Table(name = "application",uniqueConstraints = @UniqueConstraint(columnNames = {"candidate_id","job_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Application {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @Enumerated(EnumType.STRING)
    private ApplicationStatus applicationStatus;

    @ManyToOne
    @JoinColumn(name = "candidate_id")
    @JsonIgnoreProperties("applications")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Candidate candidate;

    private String resumeUrl;

    @ManyToOne
    @JoinColumn(name = "job_id")
    @JsonIgnoreProperties("applications")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Job job;

    @CreationTimestamp
    @Column(name="applied_at",nullable = false)
    private LocalDateTime appliedAt;

}

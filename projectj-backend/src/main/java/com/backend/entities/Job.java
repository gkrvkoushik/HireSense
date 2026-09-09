package com.backend.entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.CreationTimestamp;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name="job")
@Data
@AllArgsConstructor
@NoArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Job implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @ManyToOne
    @JoinColumn(name="recruiter_id")
    private Recruiter recruiter;

    @OneToMany(mappedBy = "job")
    @JsonIgnoreProperties("job")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<Application> applications;

    private String role;

    private String description;

    @ElementCollection
    private List<String> skills;

    private int experience;

    @CreationTimestamp
    @Column(name="posted_at",nullable = false)
    private LocalDateTime postedAt;

}

package com.backend.entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import lombok.ToString;
import lombok.EqualsAndHashCode;

import java.util.List;

@Entity
@Table(name="candidate")
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Candidate {

    @Id
    @GeneratedValue(strategy= GenerationType.IDENTITY)
    private int id;

    private String name;

    @Column(unique = true)
    private String email;

    @ElementCollection
    private List<String> skills;

    private int experience;

    private String resumeUrl;

    @OneToMany(mappedBy = "candidate")
    @JsonIgnoreProperties("candidate")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<Application> applications;

    @OneToOne
    @JoinColumn(name = "user_id")
    private User user;
}

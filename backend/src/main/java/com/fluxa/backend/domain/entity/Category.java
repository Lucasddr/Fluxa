package com.fluxa.backend.domain.entity;

import com.fluxa.backend.domain.enums.CategoryKind;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "categories")
public class Category {

    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private CategoryKind kind;

    @Column(name = "created_at", nullable = false, updatable = false)
    @CreationTimestamp
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    @UpdateTimestamp
    private OffsetDateTime updatedAt;

    @Column (name = "icon", nullable = false)
    private String icon;

    @Column (name = "color", nullable = false)
    private String color;

    @Column (name = "status", nullable = false)
    private boolean active;

    @Column (name = "description")
    private String description;

    public Category (User user, String name, CategoryKind kind, String icon, String color, boolean active, String description){

        this.user = user;
        this.name = name;
        this.kind = kind;
        this.icon = icon;
        this.color = color;
        this.active = active;
        this.description = description;
    }
}

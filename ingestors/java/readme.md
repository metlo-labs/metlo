To deploy,
 - make sure that there's a distributionManagement component that looks like 
 ```xml
 <distributionManagement>
    <snapshotRepository>
        <id>ossrh</id>
        <url>https://s01.oss.sonatype.org/content/repositories/snapshots/</url>

    </snapshotRepository>
    <repository>
        <id>ossrh</id>
        <url>https://s01.oss.sonatype.org/content/repositories/releases/</url>
    </repository>
</distributionManagement>
 ```
 - Run `mvn clean deploy`

Reference : [this video](https://www.youtube.com/watch?v=bxP9IuJbcDQ)